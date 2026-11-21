# API Specification — TraceDeck-Lite

Base Path: `/api/v1`

All responses follow a consistent JSON format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
Or for errors:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human readable description",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Creates a new user account and creates their initial personal Organization workspace.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Validation**:
  - `email`: valid email format.
  - `password`: min 8 chars, at least 1 number and 1 special char.
- **Response**: `201 Created`
  ```json
  {
    "user": { "id": "...", "email": "jane@example.com", "name": "Jane Doe" },
    "token": "jwt_token_here",
    "organization": { "id": "...", "name": "Jane's Workspace", "slug": "janes-workspace" }
  }
  ```

### `POST /auth/login`
Authenticates user and returns JWT / sets HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`

### `GET /auth/me`
Retrieves authenticated user profile and current active organization context.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 2. Monitors (`/monitors`)

### `GET /monitors`
Lists all monitors for the user's organization.
- **Query Params**: `page` (default 1), `limit` (default 20), `status` (`healthy`, `failing`, `disabled`)
- **Response**: `200 OK`
  ```json
  {
    "monitors": [
      {
        "id": "uuid",
        "name": "Payments API",
        "url": "https://api.stripe.com/health",
        "method": "GET",
        "intervalSeconds": 60,
        "timeoutSeconds": 5,
        "expectedStatusCodes": [200],
        "enabled": true,
        "lastCheckedAt": "2026-11-21T14:00:00Z",
        "status": "HEALTHY",
        "uptimePercent": 99.95,
        "avgLatencyMs": 142
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
  ```

### `POST /monitors`
Registers a new endpoint to monitor. Validates URL against SSRF policy at input time.
- **Request Body**:
  ```json
  {
    "name": "Auth Microservice",
    "url": "https://auth.mycompany.com/health",
    "method": "GET",
    "intervalSeconds": 300,
    "timeoutSeconds": 10,
    "expectedStatusCodes": [200]
  }
  ```
- **Response**: `201 Created`

### `GET /monitors/:id`
Retrieves single monitor details including recent 50 check results.

### `PATCH /monitors/:id`
Updates monitor configuration (name, interval, timeout, expected status codes, enabled status).

### `DELETE /monitors/:id`
Deletes a monitor and cascades results and incidents.

### `POST /monitors/:id/test`
Dispatches an immediate asynchronous manual health check.
- **Response**: `202 Accepted`
  ```json
  {
    "message": "Check queued",
    "jobId": "manual-check-uuid"
  }
  ```

### `GET /monitors/:id/results`
Returns paginated execution history (`MonitorResult`).
- **Query Params**: `page`, `limit`, `from`, `to`

---

## 3. Analytics (`/analytics`)

### `GET /analytics/overview`
Aggregated organization health metrics across a time window.
- **Query Params**: `window` (`1h`, `24h`, `7d`, `30d`)
- **Response**: `200 OK`
  ```json
  {
    "totalMonitors": 8,
    "operationalMonitors": 7,
    "failingMonitors": 1,
    "overallUptimePercent": 99.82,
    "avgLatencyMs": 184,
    "p50LatencyMs": 140,
    "p95LatencyMs": 420,
    "p99LatencyMs": 890,
    "latencyTimeSeries": [
      { "timestamp": "2026-11-21T12:00:00Z", "avgLatencyMs": 178, "successRate": 100 }
    ]
  }
  ```

---

## 4. Incidents (`/incidents`)

### `GET /incidents`
Lists incidents filtered by status.
- **Query Params**: `status` (`ACTIVE`, `RESOLVED`), `monitorId`

### `GET /incidents/:id`
Retrieves incident details, including the audit trail of `IncidentEvent`s.

### `PATCH /incidents/:id`
Manually transition incident status or update severity.
- **Request Body**:
  ```json
  {
    "status": "IDENTIFIED",
    "message": "Investigating upstream database connection pool exhaustion"
  }
  ```

---

## 5. Webhooks (`/webhooks`)

### `GET /webhooks`
Lists configured notification webhooks.

### `POST /webhooks`
Registers an outbound webhook destination.
- **Request Body**:
  ```json
  {
    "url": "https://hooks.slack.com/services/...",
    "enabled": true
  }
  ```
- **Response**: `201 Created` (returns generated webhook secret for signature verification)

### `GET /webhooks/:id/deliveries`
Returns delivery attempt logs for debugging, including HTTP status received and timestamps.
