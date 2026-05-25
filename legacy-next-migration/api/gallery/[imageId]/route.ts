import { NextResponse, type NextRequest } from "next/server";
import { UpdateGalleryImageBody, UpdateGalleryImageResponse } from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { imageId } = await params;
    const imageIdNum = Number(imageId);

    if (isNaN(imageIdNum)) {
      return error("Invalid image ID", 400);
    }

    const body = await validateBody(request, UpdateGalleryImageBody);

    const updated = await updateStore((store) => {
      const image = store.gallery.find((entry) => entry.id === imageIdNum);
      if (!image) {
        return null;
      }

      if (body.url !== undefined) image.url = body.url;
      if (body.caption !== undefined) image.caption = body.caption;
      if (body.category !== undefined) image.category = body.category;
      if (body.sortOrder !== undefined) image.sortOrder = body.sortOrder;

      return image;
    });

    if (!updated) {
      return error("Image not found", 404);
    }

    const data = UpdateGalleryImageResponse.parse(updated);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { imageId } = await params;
    const imageIdNum = Number(imageId);

    if (isNaN(imageIdNum)) {
      return error("Invalid image ID", 400);
    }

    await updateStore((store) => {
      store.gallery = store.gallery.filter((entry) => entry.id !== imageIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
