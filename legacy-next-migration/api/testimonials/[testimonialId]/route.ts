import { NextResponse, type NextRequest } from "next/server";
import { UpdateTestimonialBody } from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { testimonialId } = await params;
    const testimonialIdNum = Number(testimonialId);

    if (isNaN(testimonialIdNum)) {
      return error("Invalid testimonial ID", 400);
    }

    const body = await validateBody(request, UpdateTestimonialBody);

    const updated = await updateStore((store) => {
      const testimonial = store.testimonials.find((entry) => entry.id === testimonialIdNum);
      if (!testimonial) {
        return null;
      }

      if (body.studentName !== undefined) testimonial.studentName = body.studentName;
      if (body.country !== undefined) testimonial.country = body.country;
      if (body.program !== undefined) testimonial.program = body.program;
      if (body.message !== undefined) testimonial.message = body.message;
      if (body.avatarUrl !== undefined) testimonial.avatarUrl = body.avatarUrl;
      if (body.rating !== undefined) testimonial.rating = body.rating;
      if (body.featured !== undefined) testimonial.featured = body.featured;

      return testimonial;
    });

    if (!updated) {
      return error("Testimonial not found", 404);
    }

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ testimonialId: string }> },
) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const { testimonialId } = await params;
    const testimonialIdNum = Number(testimonialId);

    if (isNaN(testimonialIdNum)) {
      return error("Invalid testimonial ID", 400);
    }

    await updateStore((store) => {
      store.testimonials = store.testimonials.filter((entry) => entry.id !== testimonialIdNum);
    });

    return NextResponse.json({ success: true }, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
