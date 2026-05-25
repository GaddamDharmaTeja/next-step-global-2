import { NextResponse, type NextRequest } from "next/server";
import { GetDestinationResponse, UpdateDestinationBody } from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> },
) {
  try {
    const { destinationId } = await params;
    const destinationIdNum = Number(destinationId);

    if (isNaN(destinationIdNum)) {
      return error("Invalid destination ID", 400);
    }

    const store = await readStore();
    const destination = store.destinations.find((entry) => entry.id === destinationIdNum);

    if (!destination) {
      return error("Destination not found", 404);
    }

    const data = GetDestinationResponse.parse(destination);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { destinationId } = await params;
    const destinationIdNum = Number(destinationId);

    if (isNaN(destinationIdNum)) {
      return error("Invalid destination ID", 400);
    }

    const body = await validateBody(request, UpdateDestinationBody);

    const updated = await updateStore((store) => {
      const destination = store.destinations.find((entry) => entry.id === destinationIdNum);
      if (!destination) {
        return null;
      }

      if (body.name !== undefined) destination.name = body.name;
      if (body.description !== undefined) destination.description = body.description;
      if (body.country !== undefined) destination.country = body.country;
      if (body.imageUrl !== undefined) destination.imageUrl = body.imageUrl;
      if (body.featured !== undefined) destination.featured = body.featured;

      return destination;
    });

    if (!updated) {
      return error("Destination not found", 404);
    }

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { destinationId } = await params;
    const destinationIdNum = Number(destinationId);

    if (isNaN(destinationIdNum)) {
      return error("Invalid destination ID", 400);
    }

    await updateStore((store) => {
      store.destinations = store.destinations.filter((entry) => entry.id !== destinationIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
