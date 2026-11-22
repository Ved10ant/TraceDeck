import crypto from "node:crypto";
import { prisma } from "@tracedeck/database";
import { validateUrlPrecheck } from "@tracedeck/shared";
import { request, Agent } from "undici";
import { createSafeAgent } from "@tracedeck/shared";

// Backoff delays in milliseconds: attempt 1 → 5s, 2 → 30s, 3 → 120s
const BACKOFF_DELAYS_MS = [5_000, 30_000, 120_000];
const MAX_ATTEMPTS = 3;

export interface WebhookPayload {
  event: "incident.opened" | "incident.resolved" | "incident.updated";
  incidentId: string;
  monitorId: string;
  status: string;
  severity: string;
  timestamp: string;
  monitorName?: string;
  monitorUrl?: string;
}

export class WebhookService {
  private db: typeof prisma;
  private agent: Agent;

  constructor(customPrisma?: typeof prisma, customAgent?: Agent) {
    this.db = customPrisma || prisma;
    this.agent = customAgent || createSafeAgent();
  }

  /**
   * Generates HMAC-SHA256 signature for a webhook payload.
   * Format: sha256=HMAC(secret, timestamp + "." + rawBody)
   */
  generateSignature(secret: string, timestamp: number, rawBody: string): string {
    const data = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(data);
    return `sha256=${hmac.digest("hex")}`;
  }

  /**
   * Verifies an incoming HMAC-SHA256 signature (for use by webhook recipients).
   */
  verifySignature(
    secret: string,
    timestamp: number,
    rawBody: string,
    receivedSignature: string,
    toleranceSeconds: number = 300
  ): boolean {
    // Reject timestamps outside the tolerance window (replay attack prevention)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) return false;

    const expected = this.generateSignature(secret, timestamp, rawBody);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected, "utf8"),
        Buffer.from(receivedSignature, "utf8")
      );
    } catch {
      return false;
    }
  }

  /**
   * Creates a webhook configuration.
   */
  async createWebhook(organizationId: string, url: string) {
    // SSRF guard on the webhook destination URL
    validateUrlPrecheck(url);

    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await this.db.webhook.create({
      data: {
        organizationId,
        url,
        secret,
        enabled: true,
      },
    });

    return { ...webhook, secret }; // Return secret only on creation
  }

  async listWebhooks(organizationId: string) {
    return this.db.webhook.findMany({
      where: { organizationId },
      select: {
        id: true,
        url: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        // Never expose secret in list
      },
    });
  }

  async getWebhookDeliveries(organizationId: string, webhookId: string) {
    // Verify ownership
    const webhook = await this.db.webhook.findFirst({
      where: { id: webhookId, organizationId },
    });

    if (!webhook) {
      const error: any = new Error("Webhook not found or access denied");
      error.statusCode = 404;
      error.code = "WEBHOOK_NOT_FOUND";
      throw error;
    }

    return this.db.notificationDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Dispatches an incident notification to all enabled webhooks for an organization.
   * Creates a NotificationDelivery record for each webhook and queues delivery.
   */
  async dispatchIncidentNotification(
    organizationId: string,
    payload: WebhookPayload
  ): Promise<string[]> {
    const webhooks = await this.db.webhook.findMany({
      where: { organizationId, enabled: true },
    });

    const deliveryIds: string[] = [];

    for (const webhook of webhooks) {
      const idempotencyKey = `${payload.incidentId}:${webhook.id}:${payload.event}`;

      // Upsert delivery record (idempotent)
      const delivery = await this.db.notificationDelivery.upsert({
        where: { idempotencyKey },
        create: {
          webhookId: webhook.id,
          incidentId: payload.incidentId,
          status: "PENDING",
          attemptCount: 0,
          idempotencyKey,
        },
        update: {}, // Don't overwrite if already exists
      });

      deliveryIds.push(delivery.id);
    }

    return deliveryIds;
  }

  /**
   * Executes a single webhook delivery attempt with HMAC signing.
   * Records the attempt result and schedules retry on transient failures.
   */
  async executeDelivery(
    deliveryId: string,
    payload: WebhookPayload
  ): Promise<{ success: boolean; statusCode?: number; nextAttemptMs?: number }> {
    const delivery = await this.db.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: { webhook: true },
    });

    if (!delivery || !delivery.webhook) {
      throw new Error(`Delivery ${deliveryId} not found`);
    }

    if (!delivery.webhook.enabled) {
      await this.db.notificationDelivery.update({
        where: { id: deliveryId },
        data: { status: "FAILED", errorMessage: "Webhook disabled" },
      });
      return { success: false };
    }

    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(delivery.webhook.secret, timestamp, rawBody);

    let responseStatus: number | undefined;
    let errorMessage: string | undefined;
    let success = false;

    try {
      // SSRF-safe outbound POST with HMAC headers
      validateUrlPrecheck(delivery.webhook.url);

      const res = await request(delivery.webhook.url, {
        method: "POST",
        dispatcher: this.agent,
        headers: {
          "Content-Type": "application/json",
          "X-TraceDeck-Signature": signature,
          "X-TraceDeck-Timestamp": String(timestamp),
          "User-Agent": "TraceDeck-Webhook/1.0",
        },
        body: rawBody,
        maxRedirections: 0,
        headersTimeout: 10_000,
        bodyTimeout: 10_000,
      });

      res.body.destroy();
      responseStatus = res.statusCode;
      success = responseStatus >= 200 && responseStatus < 300;

      if (!success) {
        errorMessage = `HTTP ${responseStatus} from destination`;
      }
    } catch (err: any) {
      errorMessage = err.message || "Network error";
      success = false;
    }

    const attemptCount = delivery.attemptCount + 1;
    const shouldRetry = !success && attemptCount < MAX_ATTEMPTS;
    const backoffMs = shouldRetry ? BACKOFF_DELAYS_MS[attemptCount - 1] ?? 120_000 : undefined;

    await this.db.notificationDelivery.update({
      where: { id: deliveryId },
      data: {
        status: success ? "DELIVERED" : shouldRetry ? "RETRYING" : "FAILED",
        attemptCount,
        responseStatus,
        errorMessage: errorMessage ?? null,
        nextAttemptAt: shouldRetry ? new Date(Date.now() + backoffMs!) : null,
      },
    });

    return { success, statusCode: responseStatus, nextAttemptMs: backoffMs };
  }
}

export const webhookService = new WebhookService();
