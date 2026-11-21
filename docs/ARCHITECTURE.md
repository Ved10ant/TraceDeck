# System Architecture — TraceDeck-Lite

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    User([Developer / Browser]) -->|HTTP / React| WebApp["Next.js Web Frontend (Port 3000)"]
    WebApp -->|REST API Calls (Bearer Token / Cookie)| API["Express REST API (Port 4000)"]
    
    subgraph Data & Storage
        Postgres[(PostgreSQL 16)]
        Redis[(Redis 7 - BullMQ Store)]
    end
    
    API <-->|Prisma ORM| Postgres
    API -->|Enqueue Manual Test Job| Redis
    
    subgraph Background Execution Pipeline ["Combined Worker Service (scheduler/worker)"]
        Scheduler["Scheduler Loop (Ticker)"]
        Scheduler -->|Enqueue Due Checks| Redis
        
        MonWorker["BullMQ Monitoring Worker"]
        MonWorker -->|Pop Check Job| Redis
        MonWorker -->|SSRF-Guarded HTTP Request| Target["Monitored Endpoint (Public Internet)"]
        MonWorker -->|Persist Result & Check State| Postgres
        MonWorker -->|If Threshold Met: Open/Resolve Incident| Postgres
        MonWorker -->|Enqueue Webhook Alert| Redis
        
        NotifWorker["BullMQ Notification Worker"]
        NotifWorker -->|Pop Webhook Job| Redis
        NotifWorker -->|SSRF-Guarded POST + HMAC| WebhookDest["External Webhook URL"]
        NotifWorker -->|Record Attempt & Next Retry| Postgres
    end
```

## 2. Process Topology (Revision 1.1 Consolidation)

To eliminate operational fragility and accommodate free-tier hosting limits without compromising architectural boundaries, TraceDeck-Lite uses 3 distinct execution containers:

1. **`web` (Next.js)**: Server-side rendered pages and client dashboard. Communicates exclusively with the API via `/api/v1/*`.
2. **`api` (Node.js + Express + TypeScript)**: Stateless REST API handling authentication, CRUD operations, analytics queries, and manual test dispatch.
3. **`worker` (Node.js + TypeScript)**: Dedicated long-running process containing:
   - **Scheduler loop**: Identifies monitors whose `nextCheckAt <= now()` and pushes check jobs to BullMQ.
   - **`monitor-queue` worker**: Consumes health check jobs with bounded concurrency (e.g. concurrency: 10), executes the guarded HTTP request, calculates latency, persists the `MonitorResult`, updates `Monitor.lastCheckedAt` & `Monitor.nextCheckAt`, evaluates incident transition logic, and dispatches webhook events.
   - **`notification-queue` worker**: Consumes webhook delivery jobs, signs payloads with HMAC-SHA256, performs outbound POST through the SSRF guard, and logs delivery attempts.
   - **Cleanup cron**: Runs periodically (e.g. daily) to prune `MonitorResult` entries older than 30 days.

## 3. Asynchronous Job & Scheduling Strategy

### 3.1 Duplicate Scheduling Prevention
- Each scheduled check job has a deterministic BullMQ `jobId`:
  `jobId = check:{monitorId}:{timestampBucket}`
  where `timestampBucket` is rounded to the monitor's interval. This guarantees idempotency at the queue level if the scheduler runs multiple iterations or restarts.
- The monitor record updates `nextCheckAt = now + interval` atomically during scheduling or upon job completion.

### 3.2 Bounded Concurrency & Worker Health
- Worker instances configure concurrency limits (e.g., max 10 concurrent HTTP checks per worker node).
- Job lock duration, stall intervals, and graceful `SIGTERM` / `SIGINT` handlers ensure jobs in-flight are not abandoned or double-processed.

## 4. Incident State Machine

```mermaid
stateDiagram-v2
    [*] --> Healthy: Monitor Created / Passing
    Healthy --> Healthy: Status 2xx/3xx (consecutiveFailures = 0)
    Healthy --> Degraded: 1 or 2 Consecutive Failures
    Degraded --> Healthy: Success (consecutiveFailures reset to 0)
    Degraded --> Investigating: consecutiveFailures >= 3 (Auto-create Incident)
    
    Investigating --> Identified: User or policy triage
    Identified --> Monitoring: Recovery detected (1 success)
    Monitoring --> Investigating: Fails again before 2 consecutive successes
    Monitoring --> Resolved: consecutiveSuccesses >= 2 (Auto-resolve Incident)
    
    Resolved --> [*]
```

### Concurrency-Safe Incident Creation
- To eliminate race conditions between parallel worker jobs, a PostgreSQL **partial unique index** is placed on `Incident(monitorId)` where `status != 'Resolved'`.
- If two jobs attempt to open an incident simultaneously, one succeeds and the other encounters a unique constraint violation (`23505` / Prisma `P2002`), which is caught and handled idempotently without throwing unhandled exceptions.

## 5. Webhook Delivery & Idempotency Pipeline

```mermaid
sequenceDiagram
    participant Worker as Monitoring Worker
    participant DB as PostgreSQL
    participant Queue as BullMQ (notification-queue)
    participant NWorker as Notification Worker
    participant Dest as Destination (Slack/Discord/Custom)

    Worker->>DB: Open/Resolve Incident
    Worker->>DB: Create NotificationDelivery (status: PENDING, idempotencyKey: UUID)
    Worker->>Queue: Enqueue notification job (deliveryId)
    
    NWorker->>Queue: Dequeue job
    NWorker->>DB: Read Delivery + Webhook Secret
    NWorker->>NWorker: Generate HMAC-SHA256 Signature
    NWorker->>Dest: POST payload (SSRF Guarded)
    alt Success (2xx)
        NWorker->>DB: Update delivery (status: DELIVERED, attemptCount, responseStatus)
    else Transient Failure (5xx or timeout)
        NWorker->>DB: Update delivery (status: RETRYING, nextAttemptAt = now + backoff)
        NWorker->>Queue: Retry with exponential backoff delay (attempts < maxRetries)
    else Permanent Failure (4xx or SSRF Blocked)
        NWorker->>DB: Update delivery (status: FAILED, errorMessage)
    end
```
