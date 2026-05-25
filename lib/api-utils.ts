import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Send a successful JSON response
 */
export function success<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Send a successful response with no data
 */
export function successEmpty(status: number = 200): NextResponse {
  return NextResponse.json({ success: true }, { status });
}

/**
 * Send an error response
 */
export function error(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Handle API errors with proper logging
 */
export function handleApiError(err: unknown): NextResponse {
  console.error("API Error:", err);

  if (err instanceof Error) {
    // Check for specific error messages
    if (err.message.includes("Authentication required")) {
      return error("Authentication required", 401);
    }
    if (err.message.includes("Admin access required")) {
      return error("Admin access required", 403);
    }
    if (err.message.includes("Owner access required")) {
      return error("Owner access required", 403);
    }

    return error(err.message, 400);
  }

  return error("An unexpected error occurred", 500);
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody(request: NextRequest): Promise<Record<string, any>> {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T },
): Promise<T> {
  const body = await parseJsonBody(request);
  return schema.parse(body);
}

/**
 * Extract path parameters from URL
 */
export function getPathParam(params: any, key: string): string {
  const value = params?.[key];
  if (!value) {
    throw new Error(`Missing required path parameter: ${key}`);
  }
  return String(value);
}

/**
 * Check if request method is one of the allowed methods
 */
export function assertMethod(request: NextRequest, ...methods: string[]): boolean {
  return methods.includes(request.method);
}
