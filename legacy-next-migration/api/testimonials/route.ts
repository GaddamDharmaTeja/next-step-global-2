import { NextResponse, type NextRequest } from "next/server";
import {
  CreateTestimonialBody,
  ListTestimonialsResponse,
  UpdateTestimonialBody,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListTestimonialsResponse.parse(store.testimonials);
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

    const body = await validateBody(request, CreateTestimonialBody);

    const created = await updateStore((store) => {
      const testimonial = {
        id: nextNumericId(store.testimonials),
        studentName: body.studentName,
        country: body.country,
        program: body.program ?? null,
        message: body.message,
        avatarUrl: body.avatarUrl ?? null,
        rating: body.rating,
        featured: body.featured ?? false,
        createdAt: new Date().toISOString(),
      };
      store.testimonials.push(testimonial);
      return testimonial;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
