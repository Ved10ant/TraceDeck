import dotenv from "dotenv";

dotenv.config();

console.log("[TraceDeck Worker] Service initialized. Awaiting Phase C queue wiring...");

export function getWorkerStatus() {
  return { status: "ready" };
}
