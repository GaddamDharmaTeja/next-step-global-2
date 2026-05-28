import { Router } from "express";
import { nextNumericId, readStore, updateStore, type AppointmentStatus } from "../lib/store";
import { requireAdmin } from "../lib/auth";

const router = Router();
const statuses = new Set<AppointmentStatus>(["requested", "scheduled", "completed", "cancelled"]);

router.get("/", requireAdmin, async (_req, res): Promise<void> => {
  const store = await readStore();
  res.json([...store.appointments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.post("/", async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const destination = typeof req.body?.destination === "string" && req.body.destination.trim() ? req.body.destination.trim() : null;
  const preferredDate = typeof req.body?.preferredDate === "string" ? req.body.preferredDate.trim() : "";
  const preferredTime = typeof req.body?.preferredTime === "string" ? req.body.preferredTime.trim() : "";
  const notes = typeof req.body?.notes === "string" && req.body.notes.trim() ? req.body.notes.trim() : null;

  if (!name || !email || !phone || !preferredDate || !preferredTime) {
    res.status(400).json({ error: "Name, email, phone, preferred date and preferred time are required" });
    return;
  }

  const created = await updateStore((store) => {
    const appointment = {
      id: nextNumericId(store.appointments),
      name,
      email,
      phone,
      destination,
      assignedToUserId: null,
      assignedToName: null,
      preferredDate,
      preferredTime,
      notes,
      status: "requested" as const,
      createdAt: new Date().toISOString(),
    };
    store.appointments.push(appointment);
    return appointment;
  });

  res.status(201).json(created);
});

router.patch("/:appointmentId", requireAdmin, async (req, res): Promise<void> => {
  const appointmentId = Number(req.params.appointmentId);
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  const destination = typeof req.body?.destination === "string" ? req.body.destination.trim() : undefined;
  const assignedToUserId = typeof req.body?.assignedToUserId === "string" ? req.body.assignedToUserId.trim() : undefined;
  const preferredDate = typeof req.body?.preferredDate === "string" ? req.body.preferredDate.trim() : undefined;
  const preferredTime = typeof req.body?.preferredTime === "string" ? req.body.preferredTime.trim() : undefined;
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : undefined;

  if (Number.isNaN(appointmentId) || (status && !statuses.has(status as AppointmentStatus))) {
    res.status(400).json({ error: "Invalid appointment update" });
    return;
  }

  const updated = await updateStore((store) => {
    const appointment = store.appointments.find((entry) => entry.id === appointmentId);
    if (!appointment) return null;
    if (status) appointment.status = status as AppointmentStatus;
    if (destination !== undefined) appointment.destination = destination || null;
    if (assignedToUserId !== undefined) {
      const assignee = store.users.find((user) => user.id === assignedToUserId && user.passwordHash && (user.role === "admin" || user.role === "owner"));
      appointment.assignedToUserId = assignee?.id ?? null;
      appointment.assignedToName = assignee ? assignee.name || assignee.email : null;
    }
    if (preferredDate !== undefined) appointment.preferredDate = preferredDate;
    if (preferredTime !== undefined) appointment.preferredTime = preferredTime;
    if (notes !== undefined) appointment.notes = notes || null;
    return appointment;
  });

  if (!updated) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(updated);
});

router.delete("/:appointmentId", requireAdmin, async (req, res): Promise<void> => {
  const appointmentId = Number(req.params.appointmentId);
  if (Number.isNaN(appointmentId)) {
    res.status(400).json({ error: "Invalid appointment ID" });
    return;
  }

  await updateStore((store) => {
    store.appointments = store.appointments.filter((entry) => entry.id !== appointmentId);
  });
  res.status(204).send();
});

export default router;
