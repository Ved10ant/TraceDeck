import { z } from "zod";
import { validateUrlPrecheck } from "@tracedeck/shared";

export const createMonitorSchema = z.object({
  name: z.string().min(2, "Monitor name must be at least 2 characters").max(100),
  url: z
    .string()
    .url("Invalid URL format")
    .refine(
      (val) => {
        try {
          validateUrlPrecheck(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "URL rejected by SSRF security policy (private, loopback, or cloud metadata targets forbidden)",
      }
    ),
  method: z.enum(["GET", "HEAD"]).default("GET"),
  intervalSeconds: z.number().int().min(10, "Minimum interval is 10 seconds").max(86400).default(300),
  timeoutSeconds: z.number().int().min(1, "Minimum timeout is 1 second").max(30).default(10),
  expectedStatusCodes: z.array(z.number().int().min(100).max(599)).min(1).default([200]),
});

export const updateMonitorSchema = createMonitorSchema.partial().extend({
  enabled: z.boolean().optional(),
});

export const listMonitorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  enabled: z.enum(["true", "false"]).optional(),
});

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
export type ListMonitorsQuery = z.infer<typeof listMonitorsQuerySchema>;
