import { NextResponse, type NextRequest } from "next/server";
import { HealthCheckResponse } from "@/lib/schemas";
import { handleApiError } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const data = HealthCheckResponse.parse({ status: "ok" });
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err);
  }
}
