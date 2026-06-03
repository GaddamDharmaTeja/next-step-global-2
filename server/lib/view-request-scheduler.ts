import { logger } from "./logger";

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 15 * 1000;
const DEFAULT_MAX_RETRIES = 3;

let schedulerStarted = false;

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.VIEW_REQUEST_SCHEDULER_TOKEN
          ? { Authorization: process.env.VIEW_REQUEST_SCHEDULER_TOKEN }
          : {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function runViewRequest(url: string, timeoutMs: number, maxRetries: number): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const requestTime = new Date().toISOString();

    try {
      logger.info({ requestTime, attempt, url }, "Sending scheduled view request");
      const response = await fetchWithTimeout(url, timeoutMs);
      const responseBody = await response.text();

      logger.info(
        {
          requestTime,
          attempt,
          status: response.status,
          responseBody,
        },
        "Scheduled view request completed",
      );

      if (response.ok) {
        return;
      }

      if (attempt === maxRetries) {
        logger.error(
          {
            requestTime,
            status: response.status,
            responseBody,
          },
          "Scheduled view request failed after all retries",
        );
      }
    } catch (error) {
      logger.error(
        {
          requestTime,
          attempt,
          err: error,
        },
        "Scheduled view request attempt failed",
      );
    }
  }
}

export function startViewRequestScheduler(): void {
  if (schedulerStarted) {
    return;
  }

  const url = process.env.VIEW_REQUEST_SCHEDULER_URL?.trim();
  if (!url) {
    logger.info("View request scheduler disabled because VIEW_REQUEST_SCHEDULER_URL is not configured");
    return;
  }

  schedulerStarted = true;
  const intervalMs = readPositiveNumber(process.env.VIEW_REQUEST_SCHEDULER_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  const timeoutMs = readPositiveNumber(process.env.VIEW_REQUEST_SCHEDULER_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxRetries = readPositiveNumber(process.env.VIEW_REQUEST_SCHEDULER_MAX_RETRIES, DEFAULT_MAX_RETRIES);

  logger.info({ url, intervalMs, timeoutMs, maxRetries }, "Starting view request scheduler");

  setInterval(() => {
    void runViewRequest(url, timeoutMs, maxRetries);
  }, intervalMs);

  void runViewRequest(url, timeoutMs, maxRetries);
}
