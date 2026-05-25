import { NextResponse, type NextRequest } from "next/server";
import {
  CreateAppointmentBody,
  ListAppointmentsResponse,
} from "@/lib/schemas";
import { readStore, updateStore, nextNumericId } from "@/lib/server/store";
import { handleApiError, success, error, validateBody } from "@/lib/api-utils";

export async function GET(_request: NextRequest) {
  try {
    const store = await readStore();
    const data = ListAppointmentsResponse.parse(store.appointments);
    return success(data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, CreateAppointmentBody);

    const created = await updateStore((store) => {
      const appointment = {
        id: nextNumericId(store.appointments),
        name: body.name,
        email: body.email,
        phone: body.phone,
        destination: body.destination ?? null,
        preferredDate: body.preferredDate,
        preferredTime: body.preferredTime,
        notes: body.notes ?? null,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
      };
      store.appointments.push(appointment);
      return appointment;
    });

    return success(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
