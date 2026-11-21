# Security & Threat Model — TraceDeck-Lite

## 1. High-Risk Threat: Server-Side Request Forgery (SSRF)

Because TraceDeck fetches arbitrary URLs provided by users to perform health checks, an attacker could supply addresses targeting:
- Cloud instance metadata (`http://169.254.169.254/latest/meta-data/` on AWS/GCP/Azure)
- Internal container/microservice ports (`http://redis:6379`, `http://postgres:5432`)
- Localhost administration endpoints (`http://127.0.0.1:8080`, `http://localhost:3000`)
- DNS Rebinding vectors (where an attacker's domain resolves to an external IP during form validation, but switches to `127.0.0.1` upon socket connection)

---

## 2. Connect-Time Validation Architecture

Pre-flight URL validation alone is fundamentally vulnerable to **Time-of-Check to Time-of-Use (TOCTOU)** and **DNS Rebinding**. TraceDeck resolves and checks destination IP addresses **at the moment the socket connection is initiated**, overriding the HTTP agent's DNS lookup hook.

```mermaid
flowchart TD
    Req[Worker initiates check] --> Parse[URL Syntax & Protocol Check]
    Parse -->|Allowed: http/https only, no creds| Connect[Undici Agent connect.lookup]
    Connect --> DNS[Node dns.lookup to resolver]
    DNS --> CheckIP{Is IP Public Unicast?}
    CheckIP -->|No: loopback, private, metadata, IPv6 mapped| Reject[Abort: blocked_destination]
    CheckIP -->|Yes| Socket[Open TCP/TLS to validated IP]
    Socket --> Response[Read Status Code & Latency]
    Response --> Destroy[Destroy response stream immediately]
```

### Analysis of Section 21.3 Reference Skeleton & Critical Enhancements

The reference skeleton provided in Section 21.3 is:
```typescript
import dns from "node:dns";
import net from "node:net";
import ipaddr from "ipaddr.js";
import { Agent, request } from "undici";

export function isPublicIp(ip: string): boolean {
  let addr = ipaddr.parse(ip);
  if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
    addr = (addr as ipaddr.IPv6).toIPv4Address(); // ::ffff:127.0.0.1 trick
  }
  return addr.range() === "unicast"; // blocks private, loopback, linkLocal, reserved...
}
```

#### Verification & Tested Enhancements:
1. **Handling `ipaddr.parse()` safely**:
   - `ipaddr.parse(ip)` throws a JavaScript exception if the input string is not a well-formed IP. In production code, wrap `ipaddr.parse` in a `try...catch` block; if parsing fails, it must safely return `false` (block) rather than crash the worker process.
2. **Handling `dns.lookup` signatures**:
   - In Node.js, `dns.lookup(hostname, options, cb)` can invoke `cb(err, address, family)` when `all: false` or `cb(err, addresses)` when `all: true`. The wrapper standardizes both formats so every resolved address in the record is validated against `isPublicIp`. If *any* address in a multi-record answer resolves to a private or loopback IP, the entire connection is aborted.
3. **Preventing Decimal/Octal IP bypass**:
   - Node's WHATWG `URL` parser normalizes integer notations like `http://2130706433` into standard dotted-decimal `http://127.0.0.1`.
   - Node's `net.isIP('127.0.0.1')` evaluates to `4`.
   - The pre-check `if (net.isIP(host) && !isPublicIp(host))` immediately detects and drops numeric or bracketed IP literals before calling DNS.
4. **Disabling Redirects**:
   - `maxRedirections: 0`. HTTP 301/302 responses are recorded as legitimate check results (e.g., status 301) rather than followed. This completely prevents redirect-based SSRF pivot attacks.
5. **Immediate Response Destruction**:
   - `res.body.destroy()`. TraceDeck only observes HTTP status code and response latency. Destroying the incoming socket body stream immediately prevents resource exhaustion (Denial of Service) from endpoints returning infinite streams or gigabyte payloads.
6. **Allowed Ports Restriction**:
   - Only allow standard web ports: `80`, `443`, `8080`, `8443`. Prevent probe attacks against database or administrative ports (e.g. `22`, `6379`, `5432`, `27017`).

---

## 3. Required SSRF Test Matrix (Section 21.3)

| Attack Category | Test Input | Expected Behavior |
| :--- | :--- | :--- |
| **Loopback** | `http://127.0.0.1`, `http://localhost`, `http://[::1]` | Rejected at pre-check / lookup |
| **Cloud Metadata** | `http://169.254.169.254` | Rejected (`linkLocal` range) |
| **Private RFC1918** | `http://10.0.0.1`, `http://192.168.1.1`, `http://172.16.0.1` | Rejected (`private` range) |
| **Unspecified** | `http://0.0.0.0` | Rejected (`unspecified` range) |
| **IPv4-Mapped IPv6** | `http://[::ffff:127.0.0.1]` | Normalized to 127.0.0.1 -> Rejected |
| **Decimal IP Notation** | `http://2130706433` | Normalized to 127.0.0.1 -> Rejected |
| **Bad Schemes** | `file:///etc/passwd`, `ftp://example.com` | Rejected at URL scheme check |
| **Credentials in URL** | `http://admin:secret@target.com` | Rejected (`url.username` present) |
| **DNS Rebinding** | Hostname whose DNS resolves to private IP | Blocked at connect-time lookup |

---

## 4. Other Security Controls

- **Password Hashing**: Passwords stored using `bcrypt` (work factor 12) or `argon2id`.
- **JWT & Session Security**: Signed with strong secret, short expiry (15m access token / 7d refresh token or secure HTTP-only cookies with `SameSite=Lax`).
- **Data Isolation**: All queries explicitly filter by `organizationId`. A user cannot read or update another tenant's monitors, results, or incidents.
- **Webhook HMAC Signing**: Payloads are signed with `sha256=HMAC(secret, timestamp + "." + body)`. Replay attacks are mitigated by requiring timestamps within a 5-minute drift tolerance.
