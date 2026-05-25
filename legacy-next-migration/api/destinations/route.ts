import { NextResponse, type NextRequest } from "next/server";
import {
  CreateDestinationBody,
  ListDestinationsResponse,
  GetDestinationResponse,
  UpdateDestinationBody,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListDestinationsResponse.parse(store.destinations);
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

    const body = await validateBody(request, CreateDestinationBody);

    const created = await updateStore((store) => {
      const destination = {
        id: nextNumericId(store.destinations),
        name: body.name,
        description: body.description,
        country: body.country,
        imageUrl: body.imageUrl ?? null,
        featured: body.featured ?? false,
        slug: body.name.toLowerCase().replace(/\s+/g, "-"),
        code: body.country.toUpperCase().slice(0, 2),
        overview: body.description,
        highlights: [],
        universities: [],
        tuition: "",
        requirements: [],
        workOptions: [],
        accent: "from-blue-50 to-slate-50",
        createdAt: new Date().toISOString(),
      };
      store.destinations.push(destination as any);
      return destination;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
