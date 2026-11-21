# Technical Decisions Record (ADR) — TraceDeck-Lite

This document details key architectural decisions in plain language to serve as an engineering guide and interview reference.

---

## ADR 01: Connect-Time IP Validation Hook (Custom DNS Lookup) for SSRF Defense

- **Context**: TraceDeck makes outbound HTTP requests to user-supplied URLs. An attacker can set up a domain that resolves to a benign public IP during an initial check, but returns `127.0.0.1` or `169.254.169.254` (cloud metadata) milliseconds later when the HTTP client connects (DNS rebinding).
- **Decision**: Override Node's socket connection lookup (`dispatcher.connect.lookup`) using `undici`. Every IP returned by DNS is inspected right before the TCP handshake occurs. If any resolved IP belongs to a private, loopback, link-local, or cloud metadata range, the socket connection is aborted before any byte is sent.
- **Interview Pitch**: *"Pre-validating URLs with `dns.resolve()` leaves a Time-of-Check to Time-of-Use window where an attacker can switch DNS records to 127.0.0.1. By hooking undici's `connect.lookup`, we validate the exact IP Node connects to at the socket level while still preserving TLS hostname validation."*

---

## ADR 02: Partial Unique Index for Incident Deduplication

- **Context**: If an API endpoint goes down, the monitoring worker executes checks every minute. Without deduplication, 10 consecutive failures would create 10 separate incident records. Furthermore, concurrent worker nodes processing checks in parallel could create duplicate active incidents due to race conditions.
- **Decision**: A PostgreSQL partial unique index:
  `CREATE UNIQUE INDEX "idx_incident_one_active_per_monitor" ON "Incident" ("monitorId") WHERE "status" != 'RESOLVED';`
  Combined with an application state machine: if a worker attempts to create an incident when one is already active, the database enforces uniqueness (`23505` error), which the service catches and handles gracefully.
- **Interview Pitch**: *"Application-level checks like `findFirst({ where: { status: 'INVESTIGATING' } })` fail under concurrent execution. Enforcing a partial unique index in PostgreSQL provides an ACID guarantee that no monitor can ever have more than one active incident, even across distributed workers."*

---

## ADR 03: Consolidating Scheduler and Workers into a Single Process for Lite

- **Context**: Section 5 describes 5 distinct processes: API, Web, Scheduler, Monitoring Worker, Notification Worker. On free-tier cloud platforms (Render, Railway, Fly.io), running 5 separate containers leads to sleeping instances, memory exhaustion, and high deployment failure rates.
- **Decision**: For TraceDeck-Lite (Revision 1.1), maintain strict architectural boundaries in code (separate BullMQ queues, separate handler modules), but run the scheduler loop and queue consumers within a single background process (`apps/worker`).
- **Interview Pitch**: *"We kept queue definitions and worker consumers modular, but grouped them into one background service for initial release. This eliminated inter-process orchestration complexity and stays within free-tier limits without coupling the API request loop to background jobs."*

---

## ADR 04: Disabling Redirects and Destroying Response Streams

- **Context**: Following HTTP redirects allows attackers to bypass URL validation by redirecting to an internal endpoint (e.g. `http://public.com/` -> `302` -> `http://169.254.169.254/`). Additionally, reading large response bodies from slow or malicious servers causes memory exhaustion (OOM).
- **Decision**: Set `maxRedirections: 0` in undici, treating 3xx as normal result codes, and immediately call `res.body.destroy()`.
- **Interview Pitch**: *"Uptime monitors care about status codes and latency, not payload contents. By setting redirections to zero and destroying the response stream immediately, we prevent redirect SSRF attacks and eliminate memory pressure from large payloads."*

---

## ADR 05: HMAC-SHA256 Signatures and Exponential Backoff for Webhooks

- **Context**: Incident notifications sent to external webhooks must be verifiable by the receiver and resilient against transient destination failures.
- **Decision**: Sign payloads with `X-TraceDeck-Signature: sha256=<hex>` and `X-TraceDeck-Timestamp: <epoch>`. On HTTP 5xx or network timeouts, reschedule using exponential backoff (e.g., 5s, 15s, 60s). Cap retries at 3 attempts and record all attempts in `NotificationDelivery`.
- **Interview Pitch**: *"We ensure webhook integrity and non-repudiation using HMAC-SHA256 with timestamp verification to prevent replay attacks. Deliveries are processed idempotently with exponential backoff so transient target downtime doesn't drop incident alerts."*
