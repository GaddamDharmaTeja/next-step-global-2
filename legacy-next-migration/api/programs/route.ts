import { NextResponse, type NextRequest } from "next/server";
import {
  CreateProgramBody,
  ListProgramsResponse,
  UpdateProgramBody,
  UpdateProgramParams,
  DeleteProgramParams,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody, getPathParam } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListProgramsResponse.parse(store.programs);
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

    const body = await validateBody(request, CreateProgramBody);

    const created = await updateStore((store) => {
      const program = {
        id: nextNumericId(store.programs),
        title: body.title,
        description: body.description,
        country: body.country,
        duration: body.duration,
        imageUrl: body.imageUrl ?? null,
        featured: body.featured ?? false,
        createdAt: new Date().toISOString(),
      };
      store.programs.push(program);
      return program;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
