import { NextResponse, type NextRequest } from "next/server";
import { GetAdminStatsResponse } from "@/lib/schemas";
import { readStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const store = await readStore();

    const stats = GetAdminStatsResponse.parse({
      totalUsers: store.users.length,
      totalInquiries: store.inquiries.length,
      pendingInquiries: store.inquiries.filter((i) => i.status === "pending").length,
      totalPrograms: store.programs.length,
      totalGalleryImages: store.gallery.length,
      totalTestimonials: store.testimonials.length,
      recentInquiries: store.inquiries.slice(0, 5),
    });

    return success(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
