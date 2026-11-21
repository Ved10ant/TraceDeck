import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { AuthService } from "../modules/auth/auth.service";
import bcrypt from "bcryptjs";

describe("Authentication & Workspace Setup (Phase A)", () => {
  // In-memory mock database to verify full business logic & HTTP flows deterministically
  let mockUsers: any[] = [];
  let mockOrgs: any[] = [];
  let mockMemberships: any[] = [];

  const mockPrisma: any = {
    user: {
      findUnique: async ({ where }: any) => {
        const user = mockUsers.find((u) => u.email === where.email?.toLowerCase() || u.id === where.id);
        if (!user) return null;
        return {
          ...user,
          memberships: mockMemberships
            .filter((m) => m.userId === user.id)
            .map((m) => ({
              ...m,
              organization: mockOrgs.find((o) => o.id === m.organizationId),
            })),
        };
      },
      create: async ({ data }: any) => {
        const newUser = { id: `user-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockUsers.push(newUser);
        return newUser;
      },
    },
    organization: {
      create: async ({ data }: any) => {
        const newOrg = { id: `org-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockOrgs.push(newOrg);
        return newOrg;
      },
      findUnique: async ({ where }: any) => {
        return mockOrgs.find((o) => o.id === where.id || o.slug === where.slug) || null;
      },
    },
    membership: {
      create: async ({ data }: any) => {
        const newMem = { id: `mem-${Date.now()}`, ...data, createdAt: new Date() };
        mockMemberships.push(newMem);
        return newMem;
      },
    },
    $transaction: async (cb: any) => cb(mockPrisma),
  };

  const testAuthService = new AuthService(mockPrisma);

  beforeEach(() => {
    mockUsers = [];
    mockOrgs = [];
    mockMemberships = [];
  });

  describe("Input Validation & Password Security", () => {
    it("should reject registration with invalid email", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: "not-an-email",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details[0].field).toBe("email");
    });

    it("should reject registration with weak password (missing special char or numbers)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "simplepassword",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("User Registration & Workspace Creation", () => {
    it("should register a user and provision an initial organization workspace", async () => {
      const result = await testAuthService.register({
        name: "Alex Vance",
        email: "alex@example.com",
        password: "SecurePass123!",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("alex@example.com");
      expect(result.user.name).toBe("Alex Vance");
      expect((result.user as any).passwordHash).toBeUndefined(); // Never expose password hash

      expect(result.organization).toBeDefined();
      expect(result.organization.name).toBe("Alex Vance's Workspace");
      expect(result.organization.role).toBe("OWNER");
      expect(result.token).toBeDefined();

      // Verify token can be decoded
      const decoded = testAuthService.verifyToken(result.token);
      expect(decoded.userId).toBe(result.user.id);
      expect(decoded.email).toBe("alex@example.com");
      expect(decoded.organizationId).toBe(result.organization.id);
      expect(decoded.role).toBe("OWNER");
    });

    it("should prevent duplicate registration with the same email", async () => {
      await testAuthService.register({
        name: "Alex Vance",
        email: "alex@example.com",
        password: "SecurePass123!",
      });

      await expect(
        testAuthService.register({
          name: "Alex Duplicate",
          email: "alex@example.com",
          password: "SecurePass123!",
        })
      ).rejects.toThrow("An account with this email already exists");
    });
  });

  describe("User Login & Credential Verification", () => {
    it("should authenticate valid user and return JWT with workspace context", async () => {
      await testAuthService.register({
        name: "Login Tester",
        email: "login@example.com",
        password: "Password123!",
      });

      const loginRes = await testAuthService.login({
        email: "login@example.com",
        password: "Password123!",
      });

      expect(loginRes.user.email).toBe("login@example.com");
      expect(loginRes.organization?.name).toBe("Login Tester's Workspace");
      expect(loginRes.token).toBeDefined();
    });

    it("should reject login with incorrect password", async () => {
      await testAuthService.register({
        name: "Login Tester",
        email: "login@example.com",
        password: "Password123!",
      });

      await expect(
        testAuthService.login({
          email: "login@example.com",
          password: "WrongPassword!",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should reject login for non-existent user", async () => {
      await expect(
        testAuthService.login({
          email: "ghost@example.com",
          password: "Password123!",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("API Health & Session Guard", () => {
    it("GET /health should return 200 OK", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.service).toBe("tracedeck-api");
    });

    it("GET /api/v1/auth/me should reject request without Authorization header", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /api/v1/auth/me should reject invalid/malformed token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-garbage-token");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
  });
});
