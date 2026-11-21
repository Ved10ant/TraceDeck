"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSafeAgent = void 0;
exports.isPrivateTargetAllowed = isPrivateTargetAllowed;
exports.isPublicIp = isPublicIp;
exports.validateUrlPrecheck = validateUrlPrecheck;
exports.createSafeAgent = createSafeAgent;
exports.safeCheck = safeCheck;
const node_dns_1 = __importDefault(require("node:dns"));
const node_net_1 = __importDefault(require("node:net"));
const ipaddr_js_1 = __importDefault(require("ipaddr.js"));
const undici_1 = require("undici");
// Allowed ports for HTTP/HTTPS health checks
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);
function isPrivateTargetAllowed() {
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
function isPublicIp(ip) {
    try {
        let addr = ipaddr_js_1.default.parse(ip);
        // Unwrap IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
        if (addr.kind() === "ipv6" && addr.isIPv4MappedAddress()) {
            addr = addr.toIPv4Address();
        }
        const range = addr.range();
        return range === "unicast";
    }
    catch {
        return false;
    }
}
/**
 * Pre-validates URL syntax, protocols, ports, credentials, and literal IP addresses.
 */
function validateUrlPrecheck(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
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
    if (node_net_1.default.isIP(host)) {
        if (!isPrivateTargetAllowed() && !isPublicIp(host)) {
            throw new Error("blocked_destination");
        }
    }
    return url;
}
/**
 * Creates an Undici HTTP Agent with connect-time IP validation hook.
 * Inspects all resolved IPs at the exact moment of socket connection.
 */
function createSafeAgent(customLookup) {
    const lookupFn = customLookup || node_dns_1.default.lookup;
    return new undici_1.Agent({
        connect: {
            lookup(hostname, options, cb) {
                lookupFn(hostname, options, (err, address, family) => {
                    if (err) {
                        return cb(err, address, family);
                    }
                    if (isPrivateTargetAllowed()) {
                        return cb(null, address, family);
                    }
                    const addressList = Array.isArray(address)
                        ? address
                        : [{ address, family }];
                    const allPublic = addressList.every((item) => {
                        const ipStr = typeof item === "string" ? item : item.address;
                        return isPublicIp(ipStr);
                    });
                    if (!allPublic) {
                        return cb(new Error("blocked_destination"), "", 0);
                    }
                    cb(null, address, family);
                });
            },
        },
    });
}
exports.defaultSafeAgent = createSafeAgent();
/**
 * Executes an SSRF-safe outbound HTTP health check.
 * - Enforces connect-time IP validation
 * - Disables redirects (records 3xx directly)
 * - Immediately destroys response stream to prevent OOM
 */
async function safeCheck(rawUrl, options = {}) {
    const url = validateUrlPrecheck(rawUrl);
    const method = options.method || "GET";
    const timeoutMs = options.timeoutMs || 10_000;
    const dispatcher = options.agent || exports.defaultSafeAgent;
    const startTime = performance.now();
    const res = await (0, undici_1.request)(url, {
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
