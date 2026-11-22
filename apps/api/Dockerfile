FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm install
RUN npm run db:generate
RUN npm run --workspace=@tracedeck/api build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app ./

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
