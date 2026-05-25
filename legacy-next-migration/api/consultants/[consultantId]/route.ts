import { NextResponse, type NextRequest } from "next/server";
import { UpdateConsultantBody } from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { consultantId } = await params;
    const consultantIdNum = Number(consultantId);

    if (isNaN(consultantIdNum)) {
      return error("Invalid consultant ID", 400);
    }

    const body = await validateBody(request, UpdateConsultantBody);

    const updated = await updateStore((store) => {
      const consultant = store.consultants.find((entry) => entry.id === consultantIdNum);
      if (!consultant) {
        return null;
      }

      if (body.name !== undefined) consultant.name = body.name;
      if (body.specialization !== undefined) consultant.specialization = body.specialization;
      if (body.bio !== undefined) consultant.bio = body.bio;
      if (body.imageUrl !== undefined) consultant.imageUrl = body.imageUrl;
      if (body.email !== undefined) consultant.email = body.email;
      if (body.phone !== undefined) consultant.phone = body.phone;
      if (body.featured !== undefined) consultant.featured = body.featured;

      return consultant;
    });

    if (!updated) {
      return error("Consultant not found", 404);
    }

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { consultantId } = await params;
    const consultantIdNum = Number(consultantId);

    if (isNaN(consultantIdNum)) {
      return error("Invalid consultant ID", 400);
    }

    await updateStore((store) => {
      store.consultants = store.consultants.filter((entry) => entry.id !== consultantIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
