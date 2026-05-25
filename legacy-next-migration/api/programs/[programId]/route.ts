import { NextResponse, type NextRequest } from "next/server";
import {
  UpdateProgramBody,
  UpdateProgramParams,
  DeleteProgramParams,
  GetProgramResponse,
} from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const programIdNum = Number(programId);

    if (isNaN(programIdNum)) {
      return error("Invalid program ID", 400);
    }

    const store = await readStore();
    const program = store.programs.find((entry) => entry.id === programIdNum);

    if (!program) {
      return error("Program not found", 404);
    }

    const data = GetProgramResponse.parse(program);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { programId } = await params;
    const programIdNum = Number(programId);

    if (isNaN(programIdNum)) {
      return error("Invalid program ID", 400);
    }

    const body = await validateBody(request, UpdateProgramBody);

    const updated = await updateStore((store) => {
      const program = store.programs.find((entry) => entry.id === programIdNum);
      if (!program) {
        return null;
      }

      if (body.title !== undefined) program.title = body.title;
      if (body.description !== undefined) program.description = body.description;
      if (body.country !== undefined) program.country = body.country;
      if (body.duration !== undefined) program.duration = body.duration;
      if (body.imageUrl !== undefined) program.imageUrl = body.imageUrl;
      if (body.featured !== undefined) program.featured = body.featured;

      return program;
    });

    if (!updated) {
      return error("Program not found", 404);
    }

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { programId } = await params;
    const programIdNum = Number(programId);

    if (isNaN(programIdNum)) {
      return error("Invalid program ID", 400);
    }

    await updateStore((store) => {
      store.programs = store.programs.filter((entry) => entry.id !== programIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
