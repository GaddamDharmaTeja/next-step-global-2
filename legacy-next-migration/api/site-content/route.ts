import { NextResponse, type NextRequest } from "next/server";
import {
  GetSiteContentResponse,
  UpdateSiteContentBody,
} from "@/lib/schemas";
import { readStore, updateStore } from "@/lib/server/store";
import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = GetSiteContentResponse.parse({
      homeTitle: store.siteContent.heroTitle,
      homeDescription: store.siteContent.heroSubtitle,
      servicesDescription: store.siteContent.mentorshipSubtitle,
      contactEmail: store.siteContent.contactEmail,
    });
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return error("Authentication required", 401);
    }

    const body = await validateBody(request, UpdateSiteContentBody);

    const updated = await updateStore((store) => {
      if (body.homeTitle !== undefined) store.siteContent.heroTitle = body.homeTitle;
      if (body.homeDescription !== undefined) store.siteContent.heroSubtitle = body.homeDescription;
      if (body.servicesDescription !== undefined) store.siteContent.mentorshipSubtitle = body.servicesDescription;
      if (body.contactEmail !== undefined) store.siteContent.contactEmail = body.contactEmail;

      return {
        homeTitle: store.siteContent.heroTitle,
        homeDescription: store.siteContent.heroSubtitle,
        servicesDescription: store.siteContent.mentorshipSubtitle,
        contactEmail: store.siteContent.contactEmail,
      };
    });

    return success(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
