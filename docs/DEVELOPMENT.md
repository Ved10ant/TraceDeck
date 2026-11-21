# Development & Setup Guide — TraceDeck-Lite

## 1. Prerequisites
- Node.js >= 20 (v22 LTS recommended)
- npm or pnpm
- Docker & Docker Compose (for PostgreSQL and Redis)

---

## 2. Local Environment Setup

### 2.1 Clone and Install
```bash
git clone https://github.com/your-username/tracedeck.git
cd tracedeck
npm install # or pnpm install
```

### 2.2 Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-replace-in-prod
DATABASE_URL=postgresql://tracedeck:tracedeck@localhost:5432/tracedeck?schema=public
REDIS_URL=redis://localhost:6379
ALLOW_PRIVATE_TARGETS=false
```

### 2.3 Start Local PostgreSQL & Redis
```bash
docker compose up -d postgres redis
```

### 2.4 Run Database Migrations
```bash
npm run db:migrate
```

### 2.5 Start Development Servers
Run the full stack (API, Worker, and Web):
```bash
npm run dev
```
- Web Application: `http://localhost:3000`
- REST API Server: `http://localhost:4000`
- Worker: background loop attached in terminal

---

## 3. Running Automated Tests
```bash
# Run all unit tests (SSRF guards, incident state transitions, analytics calculations)
npm test

# Run SSRF specific test suite
npm run test:ssrf

# Run integration tests against local Docker containers
npm run test:integration
```
