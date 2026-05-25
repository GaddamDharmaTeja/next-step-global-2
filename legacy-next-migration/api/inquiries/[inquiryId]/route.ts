import { NextResponse, type NextRequest } from "next/server";
import { UpdateInquiryBody, GetInquiryResponse } from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> },
) {
  try {
    const { inquiryId } = await params;
    const inquiryIdNum = Number(inquiryId);

    if (isNaN(inquiryIdNum)) {
      return error("Invalid inquiry ID", 400);
    }

    const store = await readStore();
    const inquiry = store.inquiries.find((entry) => entry.id === inquiryIdNum);

    if (!inquiry) {
      return error("Inquiry not found", 404);
    }

    const data = GetInquiryResponse.parse(inquiry);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { inquiryId } = await params;
    const inquiryIdNum = Number(inquiryId);

    if (isNaN(inquiryIdNum)) {
      return error("Invalid inquiry ID", 400);
    }

    const body = await validateBody(request, UpdateInquiryBody);

    const updated = await updateStore((store) => {
      const inquiry = store.inquiries.find((entry) => entry.id === inquiryIdNum);
      if (!inquiry) {
        return null;
      }

      if (body.status !== undefined) inquiry.status = body.status;
      if (body.notes !== undefined) inquiry.notes = body.notes;

      return inquiry;
    });

    if (!updated) {
      return error("Inquiry not found", 404);
    }

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ inquiryId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { inquiryId } = await params;
    const inquiryIdNum = Number(inquiryId);

    if (isNaN(inquiryIdNum)) {
      return error("Invalid inquiry ID", 400);
    }

    await updateStore((store) => {
      store.inquiries = store.inquiries.filter((entry) => entry.id !== inquiryIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
