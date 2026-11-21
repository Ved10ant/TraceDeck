import dns from "node:dns";
import net from "node:net";
import ipaddr from "ipaddr.js";
import { Agent, request } from "undici";

// Allowed ports for HTTP/HTTPS health checks
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

export function isPrivateTargetAllowed(): boolean {
  if (process.env.ALLOW_PRIVATE_TARGETS === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: ALLOW_PRIVATE_TARGETS cannot be enabled in production");
    }
    return true;
  }
  return false;
}

/**
 * Validates whether an IP address is a public, routable unicast address.
 * Rejects loopback, private RFC1918, link-local, carrier-grade NAT, multicast, and cloud metadata.
 */
export function isPublicIp(ip: string): boolean {
  try {
    let addr = ipaddr.parse(ip);

    // Unwrap IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }

    const range = addr.range();
    return range === "unicast";
  } catch {
    return false;
  }
}

/**
 * Pre-validates URL syntax, protocols, ports, credentials, and literal IP addresses.
 */
export function validateUrlPrecheck(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("invalid_url");
  }

  // Scheme validation: strictly http or https
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("blocked_scheme");
  }

  // Credentials in URL: forbid username or password
  if (url.username || url.password) {
    throw new Error("embedded_credentials_forbidden");
  }

  // Port restriction
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new Error("disallowed_port");
  }

  // IP literal checks (Node skips DNS for IP literals)
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (!isPrivateTargetAllowed() && !isPublicIp(host)) {
      throw new Error("blocked_destination");
    }
  }

  return url;
}

export type CustomLookupFn = (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: any, family?: any) => void
) => void;

/**
 * Creates an Undici HTTP Agent with connect-time IP validation hook.
 * Inspects all resolved IPs at the exact moment of socket connection.
 */
export function createSafeAgent(customLookup?: CustomLookupFn): Agent {
  const lookupFn = customLookup || dns.lookup;

  return new Agent({
    connect: {
      lookup(hostname, options, cb) {
        lookupFn(hostname, options, (err, address, family) => {
          if (err) {
            return cb(err, address as any, family as any);
          }

          if (isPrivateTargetAllowed()) {
            return cb(null, address as any, family as any);
          }

          const addressList: { address: string; family?: number }[] = Array.isArray(address)
            ? address
            : [{ address, family }];

          const allPublic = addressList.every((item) => {
            const ipStr = typeof item === "string" ? item : item.address;
            return isPublicIp(ipStr);
          });

          if (!allPublic) {
            return cb(new Error("blocked_destination"), "" as any, 0);
          }

          cb(null, address as any, family as any);
        });
      },
    },
  });
}

export const defaultSafeAgent = createSafeAgent();

export interface SafeCheckResult {
  statusCode: number;
  latencyMs: number;
}

/**
 * Executes an SSRF-safe outbound HTTP health check.
 * - Enforces connect-time IP validation
 * - Disables redirects (records 3xx directly)
 * - Immediately destroys response stream to prevent OOM
 */
export async function safeCheck(
  rawUrl: string,
  options: {
    method?: "GET" | "HEAD";
    timeoutMs?: number;
    agent?: Agent;
  } = {}
): Promise<SafeCheckResult> {
  const url = validateUrlPrecheck(rawUrl);
  const method = options.method || "GET";
  const timeoutMs = options.timeoutMs || 10_000;
  const dispatcher = options.agent || defaultSafeAgent;

  const startTime = performance.now();

  const res = await request(url, {
    method,
    dispatcher,
    headersTimeout: timeoutMs,
    bodyTimeout: 5_000,
    maxRedirections: 0, // Never follow redirects in v1
  });

  const latencyMs = Math.round(performance.now() - startTime);

  // Immediately destroy incoming stream to prevent memory exhaustion
  res.body.destroy();

  return {
    statusCode: res.statusCode,
    latencyMs,
  };
}
