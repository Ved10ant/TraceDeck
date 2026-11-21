import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPublicIp,
  validateUrlPrecheck,
  createSafeAgent,
  safeCheck,
  isPrivateTargetAllowed,
} from "@tracedeck/shared";

describe("SSRF Defense Layer (Section 21.3 Required Test Matrix)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("IP Validation: isPublicIp()", () => {
    it("should accept valid public unicast IPv4 addresses", () => {
      expect(isPublicIp("8.8.8.8")).toBe(true);
      expect(isPublicIp("1.1.1.1")).toBe(true);
      expect(isPublicIp("93.184.216.34")).toBe(true); // example.com
    });

    it("should reject Loopback addresses (127.0.0.1, ::1)", () => {
      expect(isPublicIp("127.0.0.1")).toBe(false);
      expect(isPublicIp("127.0.0.2")).toBe(false);
      expect(isPublicIp("127.255.255.255")).toBe(false);
      expect(isPublicIp("::1")).toBe(false);
    });

    it("should reject Cloud Metadata (169.254.169.254)", () => {
      expect(isPublicIp("169.254.169.254")).toBe(false);
      expect(isPublicIp("169.254.0.1")).toBe(false);
    });

    it("should reject RFC1918 Private ranges (10.x, 172.16-31.x, 192.168.x)", () => {
      expect(isPublicIp("10.0.0.1")).toBe(false);
      expect(isPublicIp("10.255.255.255")).toBe(false);
      expect(isPublicIp("172.16.0.1")).toBe(false);
      expect(isPublicIp("172.31.255.255")).toBe(false);
      expect(isPublicIp("192.168.0.1")).toBe(false);
      expect(isPublicIp("192.168.1.1")).toBe(false);
    });

    it("should reject Unspecified address (0.0.0.0)", () => {
      expect(isPublicIp("0.0.0.0")).toBe(false);
      expect(isPublicIp("::")).toBe(false);
    });

    it("should reject Carrier-Grade NAT (100.64.0.0/10)", () => {
      expect(isPublicIp("100.64.0.1")).toBe(false);
    });

    it("should reject IPv4-Mapped IPv6 encoding tricks (::ffff:127.0.0.1)", () => {
      expect(isPublicIp("::ffff:127.0.0.1")).toBe(false);
      expect(isPublicIp("::ffff:7f00:1")).toBe(false);
      expect(isPublicIp("::ffff:10.0.0.1")).toBe(false);
      expect(isPublicIp("::ffff:169.254.169.254")).toBe(false);
    });

    it("should handle malformed or garbage strings safely without throwing", () => {
      expect(isPublicIp("not-an-ip")).toBe(false);
      expect(isPublicIp("")).toBe(false);
      expect(isPublicIp("999.999.999.999")).toBe(false);
    });
  });

  describe("URL Pre-validation: validateUrlPrecheck()", () => {
    it("should allow valid http and https URLs", () => {
      const u1 = validateUrlPrecheck("https://api.github.com/events");
      expect(u1.hostname).toBe("api.github.com");

      const u2 = validateUrlPrecheck("http://example.com/health");
      expect(u2.hostname).toBe("example.com");
    });

    it("should reject bad schemes (file://, ftp://)", () => {
      expect(() => validateUrlPrecheck("file:///etc/passwd")).toThrow("blocked_scheme");
      expect(() => validateUrlPrecheck("ftp://example.com")).toThrow("blocked_scheme");
      expect(() => validateUrlPrecheck("gopher://example.com")).toThrow("blocked_scheme");
    });

    it("should reject embedded credentials", () => {
      expect(() => validateUrlPrecheck("http://admin:secret@example.com")).toThrow(
        "embedded_credentials_forbidden"
      );
      expect(() => validateUrlPrecheck("https://user@api.example.com")).toThrow(
        "embedded_credentials_forbidden"
      );
    });

    it("should reject disallowed ports (e.g. 22 SSH, 6379 Redis, 5432 Postgres)", () => {
      expect(() => validateUrlPrecheck("http://example.com:22")).toThrow("disallowed_port");
      expect(() => validateUrlPrecheck("http://example.com:6379")).toThrow("disallowed_port");
      expect(() => validateUrlPrecheck("http://example.com:5432")).toThrow("disallowed_port");
    });

    it("should allow standard web ports (80, 443, 8080, 8443)", () => {
      expect(() => validateUrlPrecheck("http://example.com:80")).not.toThrow();
      expect(() => validateUrlPrecheck("https://example.com:443")).not.toThrow();
      expect(() => validateUrlPrecheck("http://example.com:8080")).not.toThrow();
      expect(() => validateUrlPrecheck("https://example.com:8443")).not.toThrow();
    });

    it("should reject raw IP literals pointing to private/loopback/cloud metadata", () => {
      expect(() => validateUrlPrecheck("http://127.0.0.1")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://169.254.169.254")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://10.0.0.1")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://192.168.1.1")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://0.0.0.0")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://[::1]")).toThrow("blocked_destination");
      expect(() => validateUrlPrecheck("http://[::ffff:127.0.0.1]")).toThrow("blocked_destination");
    });

    it("should reject decimal IP representations (http://2130706433 -> 127.0.0.1)", () => {
      // WHATWG parser normalizes 2130706433 to 127.0.0.1
      expect(() => validateUrlPrecheck("http://2130706433")).toThrow("blocked_destination");
    });
  });

  describe("Connect-Time IP Validation Hook & DNS Rebinding Defenses", () => {
    it("should block hostname resolving to private IP at connect time", async () => {
      const mockLookup = vi.fn((hostname, options, cb) => {
        // Simulates DNS resolving to internal IP
        cb(null, "10.0.0.5", 4);
      });

      const agent = createSafeAgent(mockLookup as any);

      await expect(
        safeCheck("http://internal.company.corp/health", { agent })
      ).rejects.toThrow();
    });

    it("should block multi-address DNS response if any address is private", async () => {
      const mockLookup = vi.fn((hostname, options, cb) => {
        // Multi-address DNS answer containing both public and private IP
        cb(
          null,
          [
            { address: "93.184.216.34", family: 4 },
            { address: "127.0.0.1", family: 4 },
          ],
          undefined
        );
      });

      const agent = createSafeAgent(mockLookup as any);

      await expect(
        safeCheck("http://dual-homed.attacker.com/status", { agent })
      ).rejects.toThrow();
    });

    it("should defend against DNS Rebinding (lookup returning private IP during connect)", async () => {
      let lookupCount = 0;
      const mockLookup = vi.fn((hostname, options, cb) => {
        lookupCount++;
        if (lookupCount === 1) {
          // Attacker returned public IP at pre-stage
          cb(null, "93.184.216.34", 4);
        } else {
          // Attacker switched to 169.254.169.254 on connect
          cb(null, "169.254.169.254", 4);
        }
      });

      const agent = createSafeAgent(mockLookup as any);

      // Even if precheck passes, connect-time hook catches the switched IP
      await expect(
        safeCheck("http://rebind.attacker.com/metadata", { agent })
      ).rejects.toThrow();
    });
  });

  describe("ALLOW_PRIVATE_TARGETS Production Safeguard", () => {
    it("should fail startup if ALLOW_PRIVATE_TARGETS is true in production", () => {
      process.env.ALLOW_PRIVATE_TARGETS = "true";
      process.env.NODE_ENV = "production";

      expect(() => isPrivateTargetAllowed()).toThrow(
        "FATAL: ALLOW_PRIVATE_TARGETS cannot be enabled in production"
      );
    });

    it("should allow private target in development/test when explicitly enabled", () => {
      process.env.ALLOW_PRIVATE_TARGETS = "true";
      process.env.NODE_ENV = "test";

      expect(isPrivateTargetAllowed()).toBe(true);
    });
  });
});
