import { NextResponse, type NextRequest } from "next/server";
import {
  CreateGalleryImageBody,
  ListGalleryImagesResponse,
  UpdateGalleryImageBody,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListGalleryImagesResponse.parse(store.gallery);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const body = await validateBody(request, CreateGalleryImageBody);

    const created = await updateStore((store) => {
      const image = {
        id: nextNumericId(store.gallery),
        url: body.url,
        caption: body.caption ?? null,
        category: body.category ?? null,
        sortOrder: body.sortOrder ?? 0,
        createdAt: new Date().toISOString(),
      };
      store.gallery.push(image);
      return image;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
