# TraceDeck

> **API Observability & Incident Management Platform**  
> *Monitor. Detect. Investigate. Resolve.*

TraceDeck is a production-oriented API observability and incident management SaaS platform. It monitors endpoint availability, analyzes latency distributions (P50/P95/P99), detects failures, manages incident lifecycles, and dispatches authenticated webhook notifications with exponential backoff.

---

## Key Highlights

- **Connect-Time SSRF Defense**: Custom DNS lookup on the HTTP agent validating all resolved IPs before socket connection to prevent DNS rebinding and internal network probing.
- **ACID Incident Deduplication**: PostgreSQL partial unique index ensuring strictly at most one active incident per monitor under concurrent worker executions.
- **Asynchronous Queue Pipeline**: Decoupled HTTP health checks and notification deliveries powered by Redis and BullMQ.
- **Real-Data Analytics Engine**: Uptime %, P50/P95/P99 latency calculations computed from persisted check results.
- **Idempotent Webhook Engine**: Payloads signed with HMAC-SHA256, exponential backoff retries, and full attempt history.

---

## Documentation

- [Detailed PRD](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/PRD.md)
- [System Architecture](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/ARCHITECTURE.md)
- [Database Schema & ER Diagram](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/DATABASE.md)
- [API Specification](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/API.md)
- [Security & Threat Model](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/SECURITY.md)
- [Technical Decisions Record (ADR)](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/DECISIONS.md)
- [Development & Setup Guide](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/DEVELOPMENT.md)
- [Implementation Status](file:///c:/Users/prach/OneDrive/Desktop/MY/TraceDeck/docs/IMPLEMENTATION_STATUS.md)
