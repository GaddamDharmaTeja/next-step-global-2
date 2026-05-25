import { NextResponse, type NextRequest } from "next/server";
import {
  CreateConsultantBody,
  ListConsultantsResponse,
  UpdateConsultantBody,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListConsultantsResponse.parse(store.consultants);
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

    const body = await validateBody(request, CreateConsultantBody);

    const created = await updateStore((store) => {
      const consultant = {
        id: nextNumericId(store.consultants),
        name: body.name,
        specialization: body.specialization,
        bio: body.bio ?? null,
        imageUrl: body.imageUrl ?? null,
        email: body.email,
        phone: body.phone ?? null,
        featured: body.featured ?? false,
        role: "Consultant",
        specialty: body.specialization,
        experience: "0 Years",
        countries: [],
        languages: [],
        sortOrder: nextNumericId(store.consultants),
        createdAt: new Date().toISOString(),
      };
      store.consultants.push(consultant as any);
      return consultant;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
