# Product Requirements Document (PRD) — TraceDeck-Lite

## 1. Product Vision & Value Proposition
TraceDeck is a developer-first API observability and incident management platform. It allows engineers to monitor API availability, measure latency metrics (P50/P95/P99), automatically detect downtime or degradation, record incident lifecycles, and dispatch webhook alerts with exponential backoff.

Unlike basic uptime monitors or shallow CRUD applications, TraceDeck is architected with a decoupled background worker pipeline (BullMQ + Redis), connect-time SSRF defenses, concurrency-safe incident state machines, and real-data metric aggregations.

## 2. Scope Governance: Revision 1.1 (TraceDeck-Lite)
Following Revision 1.1, the platform is strictly scoped into **TraceDeck-Lite** first to ensure end-to-end reliability, verifiable security, and zero unexplainable bloat.

### 2.1 In-Scope for TraceDeck-Lite (Release 1)
- **Authentication & Single-Tenant Workspace**:
  - Secure email/password authentication using Argon2id / bcrypt.
  - Session/token lifecycle with HTTP-only cookies or secure bearer tokens.
  - Workspace scoped with `organizationId` retained on all data models for seamless multi-tenant migration.
- **API Endpoint Monitoring**:
  - Monitor registration: Name, URL, HTTP method (GET/HEAD), interval (e.g., 1m, 5m, 15m), timeout (1s - 30s), expected status codes (e.g. 200, 204).
  - Enable/disable monitor toggle.
  - Asynchronous manual test ("Check Now") via worker job.
- **Combined Scheduler & BullMQ Worker**:
  - Polling scheduler discovering due monitors and enqueuing jobs with deterministic job IDs.
  - Worker executing HTTP checks using custom DNS connect-time validation.
  - Result persistence to PostgreSQL (`MonitorResult`: statusCode, latencyMs, outcome, timestamp).
  - 30-day data retention cleanup job.
- **Performance Analytics**:
  - Calculation derived strictly from real persisted results (uptime %, average latency, P50, P95, P99, error rate).
  - Time ranges: Last 1 hour, 24 hours, 7 days, 30 days.
  - Clean empty-states for monitors with no check history yet.
- **Incident State Machine & Deduplication**:
  - Threshold triggers: e.g., 3 consecutive failures to open an incident; 2 consecutive successes to resolve.
  - Database-enforced partial unique index (`monitorId` where `status != 'Resolved'`) guaranteeing at most one active incident per monitor.
  - Incident event timeline (Investigating -> Identified -> Monitoring -> Resolved).
- **Webhook Delivery Engine**:
  - HMAC-SHA256 signature header (`X-TraceDeck-Signature`) and timestamp header (`X-TraceDeck-Timestamp`).
  - Exponential backoff retries with delivery attempt logs and idempotency keys.
  - Outbound destination protected by the same SSRF guard.
- **SSRF Defense Layer**:
  - Connect-time IP validation via custom DNS lookup.
  - Blocking loopback, private ranges, link-local, cloud metadata (169.254.169.254), IPv4-mapped IPv6, and decimal/octal IPs.
  - No redirect following in v1 (records 3xx directly).
  - Port restrictions (HTTP/HTTPS on allowed ports).
- **Developer UI**:
  - Next.js + Tailwind CSS + shadcn/ui.
  - Dark-mode developer SaaS aesthetic (inspired by Linear / Better Stack).
  - Polling/manual refresh for dashboard metrics.
- **DevOps & Verification**:
  - Docker Compose for PostgreSQL, Redis, API + Worker, Web.
  - Unit, integration, and end-to-end CI pipeline via GitHub Actions.

### 2.2 Explicitly Deferred (Post-Lite Release 2)
- Multi-organization invitations and full RBAC matrix.
- Socket.IO live updates (deferred in favor of polling to minimize operational failure modes).
- Google OAuth.
- Multi-region distributed probe nodes.
- API keys, audit logs, and custom alerting rule DSL.
- Paid billing/stripe tiers and seat quotas.
- Database rollup/partitioning tables (unneeded at Lite scale).
- Separate notification-worker process (handled via a secondary queue within the single worker process).

## 3. User Personas & Core Journeys
- **Solo Backend Developer**: Registers a deployed API endpoint, triggers an instant test, configures an incident webhook to a Discord/Slack endpoint, and verifies downtime alerts when the staging server restarts.
- **Startup Tech Lead**: Monitors critical third-party dependencies (payment gateway, auth provider) and tracks latency spikes across P95/P99 over a 7-day window.

## 4. Non-Functional Requirements
- **Security**: Zero possibility of SSRF into internal networks or cloud metadata.
- **Reliability**: Worker crash during job execution must not leave dangling state or duplicate active incidents.
- **Performance**: Monitor execution must never block the REST API event loop.
- **Auditability**: Every architectural decision documented in `docs/DECISIONS.md`.
