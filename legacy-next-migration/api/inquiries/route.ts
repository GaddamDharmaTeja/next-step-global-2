import { NextResponse, type NextRequest } from "next/server";
import {
  CreateInquiryBody,
  ListInquiriesResponse,
  UpdateInquiryBody,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListInquiriesResponse.parse(store.inquiries);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, CreateInquiryBody);

    const created = await updateStore((store) => {
      const inquiry = {
        id: nextNumericId(store.inquiries),
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        whatsapp: body.whatsapp ?? null,
        subject: body.subject,
        message: body.message,
        status: "pending" as const,
        leadStage: "new" as const,
        assignedToUserId: null,
        assignedToName: null,
        followUpAt: null,
        notes: null,
        createdAt: new Date().toISOString(),
      };
      store.inquiries.push(inquiry);
      return inquiry;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
