import { apiBaseUrl } from "./runtime";

export interface AuthPayload {
  name?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface SessionUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: "user" | "admin" | "manager" | "owner";
  positionId?: string | null;
  positionName?: string | null;
  reportsToUserId?: string | null;
  reportsToName?: string | null;
  createdAt: string;
}

export interface OwnerSettingsRecord {
  companyName: string;
  ownerName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  defaultCounselorMessage: string;
  brandTagline: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId?: string | null;
  actorName: string;
  actorRole: "user" | "admin" | "manager" | "owner" | "system";
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface AdminInviteRecord {
  id: string;
  email: string;
  role: "admin" | "manager" | "owner";
  status: "pending" | "accepted" | "revoked";
  invitedByUserId?: string | null;
  invitedByName: string;
  createdAt: string;
  acceptedAt?: string | null;
}

export interface NotificationTemplateRecord {
  id: string;
  name: string;
  channel: "email" | "whatsapp" | "both";
  purpose?: string | null;
  subject: string;
  message: string;
  updatedAt: string;
}

export interface StudentDocumentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string | null;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
  status: "uploaded" | "reviewing" | "approved" | "rejected";
  documentType?: string | null;
  checklistItemId?: string | null;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  note?: string | null;
  uploadedAt: string;
}

export type ProgramLevel = "undergraduate" | "postgraduate" | "research" | "diploma" | "any";

export interface ScholarshipRecord {
  id: number;
  name: string;
  country: string;
  programLevel: ProgramLevel;
  eligibility: string;
  awardValue: string;
  deadline: string;
  intake?: string | null;
  applicationLink?: string | null;
  active: boolean;
  createdAt: string;
}

export interface DocumentChecklistTemplateRecord {
  id: number;
  destination: string;
  programLevel: ProgramLevel;
  title: string;
  items: Array<{ id: string; label: string; required: boolean }>;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  inquiryId?: number | null;
  studentEmail: string;
  studentUserId?: string | null;
  senderUserId?: string | null;
  senderName: string;
  senderRole: "user" | "admin" | "manager" | "owner" | "system";
  body: string;
  createdAt: string;
}

export interface ChatUserRecord {
  id: string;
  email: string;
  name?: string | null;
  role: "user" | "admin" | "manager" | "owner";
  createdAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderUserId?: string | null;
  senderName: string;
  senderRole: "user" | "admin" | "manager" | "owner" | "system";
  body: string;
  createdAt: string;
}

export interface ChatConversationRecord {
  id: string;
  type: "direct" | "group";
  title: string;
  createdByUserId?: string | null;
  createdByName: string;
  memberUserIds: string[];
  members: ChatUserRecord[];
  messages: ChatMessageRecord[];
  lastMessage?: ChatMessageRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRecord {
  id: string;
  type: "follow_up" | "stale_lead";
  priority: "high" | "medium";
  inquiry: InquiryRecord;
  message: string;
}

export interface UserPositionRecord {
  id: string;
  name: string;
  level: number;
  description?: string | null;
  reportsToPositionId?: string | null;
  createdAt: string;
}

export interface RoleMenuAccessRecord {
  admin: string[];
  userPortal: string[];
}

export interface DatabaseCollectionStat {
  key: string;
  label: string;
  count: number;
  bytes: number;
  clearable: boolean;
}

export interface DatabaseStatsRecord {
  totalBytes: number;
  collections: DatabaseCollectionStat[];
  updatedAt: string;
  cleared?: string[];
}

export interface InquiryRecord {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  subject: string;
  message: string;
  status: "pending" | "contacted" | "resolved";
  leadStage?: "new" | "contacted" | "counseling" | "documents" | "applied" | "offer" | "visa" | "enrolled" | "lost";
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  followUpAt?: string | null;
  notes?: string | null;
  leadScore?: number;
  destination?: string | null;
  programLevel?: ProgramLevel | null;
  intake?: string | null;
  lastContactedAt?: string | null;
  visaReadinessScore?: number;
  createdAt: string;
}

export interface GalleryUploadResult {
  id: number;
  url: string;
  caption?: string | null;
  category?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface DestinationRecord {
  id: number;
  slug: string;
  code: string;
  name: string;
  description: string;
  overview: string;
  highlights: string[];
  universities: string[];
  tuition: string;
  requirements: string[];
  workOptions: string[];
  accent: string;
  featured: boolean;
  createdAt: string;
}

export interface AppointmentRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  destination?: string | null;
  consultantId?: number | null;
  consultantName?: string | null;
  meetingType?: "phone" | "video" | "office";
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  preferredDate: string;
  preferredTime: string;
  notes?: string | null;
  status: "requested" | "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

export interface AppointmentPayload {
  name: string;
  email: string;
  phone: string;
  destination?: string;
  consultantId?: number | null;
  meetingType?: "phone" | "video" | "office";
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface ConsultantRecord {
  id: number;
  name: string;
  role: string;
  specialty: string;
  experience: string;
  imageUrl?: string | null;
  bio: string;
  countries: string[];
  languages: string[];
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export type DestinationPayload = Omit<DestinationRecord, "id" | "createdAt">;
export type ConsultantPayload = Omit<ConsultantRecord, "id" | "createdAt">;

export interface SiteContentRecord {
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  metrics: Array<{ value: string; label: string }>;
  mentorshipTitle: string;
  mentorshipSubtitle: string;
  services: Array<{ title: string; text: string }>;
  faqs: Array<{ question: string; answer: string }>;
  intakeTimeline: Array<{ intake: string; deadline: string; description: string }>;
  aboutTitle: string;
  aboutText: string;
  aboutHighlights: string[];
  contactTitle: string;
  contactText: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
}

export interface UploadGalleryPayload {
  file: File;
  caption?: string;
  category?: string;
  sortOrder?: number;
}

export interface UploadStudentDocumentPayload {
  file: File;
  documentType?: string | null;
  checklistItemId?: string | null;
}

const MAX_UPLOAD_SIZE = 15 * 1024 * 1024;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function asRecordArray<T>(value: unknown, keys: string[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "results", ...keys]) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}

function normalizeDestinationRecord(record: DestinationRecord): DestinationRecord {
  return {
    ...record,
    highlights: asStringArray(record.highlights),
    universities: asStringArray(record.universities),
    requirements: asStringArray(record.requirements),
    workOptions: asStringArray(record.workOptions),
    accent: asString(record.accent, "from-blue-50 to-slate-50"),
  };
}

function normalizeConsultantRecord(record: ConsultantRecord): ConsultantRecord {
  return {
    ...record,
    countries: asStringArray(record.countries),
    languages: asStringArray(record.languages),
  };
}

function normalizeSiteContentRecord(record: SiteContentRecord): SiteContentRecord {
  return {
    ...record,
    metrics: Array.isArray(record.metrics)
      ? record.metrics
          .map((metric) => ({
            value: asString(metric?.value),
            label: asString(metric?.label),
          }))
          .filter((metric) => metric.value || metric.label)
      : [],
    services: Array.isArray(record.services)
      ? record.services
          .map((service) => ({
            title: asString(service?.title),
            text: asString(service?.text),
          }))
          .filter((service) => service.title || service.text)
      : [],
    faqs: Array.isArray(record.faqs)
      ? record.faqs
          .map((faq) => ({
            question: asString(faq?.question),
            answer: asString(faq?.answer),
          }))
          .filter((faq) => faq.question || faq.answer)
      : [],
    intakeTimeline: Array.isArray(record.intakeTimeline)
      ? record.intakeTimeline
          .map((intake) => ({
            intake: asString(intake?.intake),
            deadline: asString(intake?.deadline),
            description: asString(intake?.description),
          }))
          .filter((intake) => intake.intake || intake.deadline || intake.description)
      : [],
    aboutHighlights: asStringArray(record.aboutHighlights),
  };
}

function apiUrl(path: string): string {
  if (!apiBaseUrl || !path.startsWith("/")) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(url), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function signIn(payload: AuthPayload) {
  return request<SessionUser>("/api/users/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signUp(payload: AuthPayload) {
  return request<SessionUser>("/api/users/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signOut() {
  const response = await fetch(apiUrl("/api/users/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to sign out");
  }
}

export async function resetPassword(payload: { email: string; password: string }) {
  return request<{ ok: true }>("/api/users/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read selected file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadGalleryImage(payload: UploadGalleryPayload) {
  if (payload.file.size > MAX_UPLOAD_SIZE) {
    throw new Error("Please choose an image smaller than 15MB");
  }

  const dataUrl = await readFileAsDataUrl(payload.file);
  const [, base64Data = ""] = dataUrl.split(",", 2);

  return request<GalleryUploadResult>("/api/gallery/upload", {
    method: "POST",
    body: JSON.stringify({
      filename: payload.file.name,
      contentType: payload.file.type,
      base64Data,
      caption: payload.caption || null,
      category: payload.category || null,
      sortOrder: payload.sortOrder ?? 0,
    }),
  });
}

export async function uploadImageFile(file: File, options?: { caption?: string; category?: string }) {
  return uploadGalleryImage({
    file,
    caption: options?.caption,
    category: options?.category || "asset",
  });
}

export async function uploadStudentDocument(payload: UploadStudentDocumentPayload) {
  const dataUrl = await readFileAsDataUrl(payload.file);
  const [, base64Data = ""] = dataUrl.split(",", 2);

  return request<StudentDocumentRecord>("/api/student-documents/mine", {
    method: "POST",
    body: JSON.stringify({
      filename: payload.file.name,
      contentType: payload.file.type,
      base64Data,
      documentType: payload.documentType || null,
      checklistItemId: payload.checklistItemId || null,
    }),
  });
}

export async function listMyInquiries() {
  const data = await request<InquiryRecord[]>("/api/inquiries/mine", {
    method: "GET",
  });
  return Array.isArray(data) ? data : [];
}

export async function listInquiriesManual() {
  const data = await request<unknown>("/api/inquiries", {
    method: "GET",
  });
  return asRecordArray<InquiryRecord>(data, ["inquiries"]);
}

export async function updateInquiryLead(
  inquiryId: number,
  payload: {
    leadStage: NonNullable<InquiryRecord["leadStage"]>;
    notes?: string | null;
    followUpAt?: string | null;
    assignedToUserId?: string | null;
    destination?: string | null;
    programLevel?: ProgramLevel | null;
    intake?: string | null;
  },
) {
  return request<InquiryRecord>(`/api/inquiries/${inquiryId}/lead`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listScholarships(params?: { country?: string; level?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params?.country) search.set("country", params.country);
  if (params?.level) search.set("level", params.level);
  if (params?.q) search.set("q", params.q);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const data = await request<unknown>(`/api/scholarships${suffix}`, { method: "GET" });
  return asRecordArray<ScholarshipRecord>(data, ["scholarships"]);
}

export async function createScholarship(payload: Omit<ScholarshipRecord, "id" | "createdAt">) {
  return request<ScholarshipRecord>("/api/scholarships", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateScholarship(id: number, payload: Partial<Omit<ScholarshipRecord, "id" | "createdAt">>) {
  return request<ScholarshipRecord>(`/api/scholarships/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteScholarship(id: number) {
  const response = await fetch(apiUrl(`/api/scholarships/${id}`), { method: "DELETE", credentials: "include" });
  if (!response.ok && response.status !== 204) throw new Error("Failed to delete scholarship");
}

export async function listDocumentChecklists(params?: { destination?: string; level?: string }) {
  const search = new URLSearchParams();
  if (params?.destination) search.set("destination", params.destination);
  if (params?.level) search.set("level", params.level);
  const suffix = search.toString() ? `?${search.toString()}` : "";
  const data = await request<unknown>(`/api/document-checklists${suffix}`, { method: "GET" });
  return asRecordArray<DocumentChecklistTemplateRecord>(data, ["documentChecklists", "documentChecklistTemplates"]);
}

export async function createDocumentChecklist(payload: Omit<DocumentChecklistTemplateRecord, "id" | "createdAt">) {
  return request<DocumentChecklistTemplateRecord>("/api/document-checklists", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateDocumentChecklist(id: number, payload: Partial<Omit<DocumentChecklistTemplateRecord, "id" | "createdAt">>) {
  return request<DocumentChecklistTemplateRecord>(`/api/document-checklists/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteDocumentChecklist(id: number) {
  const response = await fetch(apiUrl(`/api/document-checklists/${id}`), { method: "DELETE", credentials: "include" });
  if (!response.ok && response.status !== 204) throw new Error("Failed to delete checklist");
}

export async function listMyMessages() {
  const data = await request<unknown>("/api/messages/mine", { method: "GET" });
  return asRecordArray<MessageRecord>(data, ["messages"]);
}

export async function createMyMessage(payload: { inquiryId?: number | null; body: string }) {
  return request<MessageRecord>("/api/messages/mine", { method: "POST", body: JSON.stringify(payload) });
}

export async function listMessages() {
  const data = await request<unknown>("/api/messages", { method: "GET" });
  return asRecordArray<MessageRecord>(data, ["messages"]);
}

export async function createMessage(payload: { studentEmail: string; inquiryId?: number | null; body: string }) {
  return request<MessageRecord>("/api/messages", { method: "POST", body: JSON.stringify(payload) });
}

export async function listChatUsers() {
  const data = await request<unknown>("/api/chat/users", { method: "GET" });
  return asRecordArray<ChatUserRecord>(data, ["users"]);
}

export async function listChatConversations() {
  const data = await request<unknown>("/api/chat/conversations", { method: "GET" });
  return asRecordArray<ChatConversationRecord>(data, ["conversations"]);
}

export async function createChatConversation(payload: { type: "direct" | "group"; title?: string; memberUserIds: string[] }) {
  return request<ChatConversationRecord>("/api/chat/conversations", { method: "POST", body: JSON.stringify(payload) });
}

export async function sendChatMessage(conversationId: string, body: string) {
  return request<ChatMessageRecord>(`/api/chat/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
}

export async function deleteChatConversation(conversationId: string) {
  const response = await fetch(apiUrl(`/api/chat/conversations/${conversationId}`), { method: "DELETE", credentials: "include" });
  if (!response.ok && response.status !== 204) {
    const payload = await parseResponse(response);
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to delete chat";
    throw new Error(message);
  }
}

export async function listReminders() {
  return request<ReminderRecord[]>("/api/reminders", { method: "GET" });
}

export async function listOwnerSettings() {
  return request<OwnerSettingsRecord>("/api/owner-settings", { method: "GET" });
}

export async function updateOwnerSettings(payload: OwnerSettingsRecord) {
  return request<OwnerSettingsRecord>("/api/owner-settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getDatabaseStats() {
  return request<DatabaseStatsRecord>("/api/owner-settings/database", { method: "GET" });
}

export async function clearDatabaseCollections(collections: string[]) {
  return request<DatabaseStatsRecord>("/api/owner-settings/database/clear", {
    method: "POST",
    body: JSON.stringify({ collections }),
  });
}

export async function listAuditLogs() {
  return request<AuditLogRecord[]>("/api/audit-logs", { method: "GET" });
}

export async function listAdminInvites() {
  return request<AdminInviteRecord[]>("/api/admin-invites", { method: "GET" });
}

export async function createAdminInvite(payload: { email: string; role: "admin" | "manager" | "owner" }) {
  return request<AdminInviteRecord>("/api/admin-invites", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(userId: string) {
  const response = await fetch(apiUrl(`/api/users/${userId}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    const payload = await parseResponse(response);
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to delete user";
    throw new Error(message);
  }
}

export async function updateUserProfile(userId: string, payload: { positionId?: string; reportsToUserId?: string }) {
  return request<SessionUser>(`/api/users/${userId}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listUserPositions() {
  return request<UserPositionRecord[]>("/api/user-positions", { method: "GET" });
}

export async function createUserPosition(payload: { name: string; level: number; description?: string | null; reportsToPositionId?: string | null }) {
  return request<UserPositionRecord>("/api/user-positions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserPosition(positionId: string, payload: Partial<{ name: string; level: number; description: string | null; reportsToPositionId: string | null }>) {
  return request<UserPositionRecord>(`/api/user-positions/${positionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUserPosition(positionId: string) {
  const response = await fetch(apiUrl(`/api/user-positions/${positionId}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete position");
  }
}

export async function listNotificationTemplates() {
  return request<NotificationTemplateRecord[]>("/api/notification-templates", { method: "GET" });
}

export async function getRoleMenuAccess() {
  return request<RoleMenuAccessRecord>("/api/role-menu-access", { method: "GET" });
}

export async function updateRoleMenuAccess(payload: RoleMenuAccessRecord) {
  return request<RoleMenuAccessRecord>("/api/role-menu-access", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createNotificationTemplate(payload: Omit<NotificationTemplateRecord, "id" | "updatedAt">) {
  return request<NotificationTemplateRecord>("/api/notification-templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNotificationTemplate(
  templateId: string,
  payload: Partial<Omit<NotificationTemplateRecord, "id" | "updatedAt">>,
) {
  return request<NotificationTemplateRecord>(`/api/notification-templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listMyStudentDocuments() {
  const data = await request<StudentDocumentRecord[]>("/api/student-documents/mine", { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function listStudentDocuments() {
  return request<StudentDocumentRecord[]>("/api/student-documents", { method: "GET" });
}

export async function updateStudentDocument(
  documentId: string,
  payload: {
    status?: StudentDocumentRecord["status"];
    documentType?: string | null;
    assignedToUserId?: string | null;
    note?: string | null;
  },
) {
  return request<StudentDocumentRecord>(`/api/student-documents/${documentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listDestinations() {
  const data = await request<DestinationRecord[]>("/api/destinations", {
    method: "GET",
  });
  return Array.isArray(data) ? data.map(normalizeDestinationRecord) : [];
}

export async function getDestination(slug: string) {
  const data = await request<DestinationRecord>(`/api/destinations/${slug}`, {
    method: "GET",
  });
  return normalizeDestinationRecord(data);
}

export async function createDestination(payload: DestinationPayload) {
  return request<DestinationRecord>("/api/destinations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDestination(id: number, payload: DestinationPayload) {
  return request<DestinationRecord>(`/api/destinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteDestination(id: number) {
  const response = await fetch(apiUrl(`/api/destinations/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete destination");
  }
}

export async function listConsultants() {
  const data = await request<ConsultantRecord[]>("/api/consultants", {
    method: "GET",
  });
  return Array.isArray(data) ? data.map(normalizeConsultantRecord) : [];
}

export async function createConsultant(payload: ConsultantPayload) {
  return request<ConsultantRecord>("/api/consultants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateConsultant(id: number, payload: ConsultantPayload) {
  return request<ConsultantRecord>(`/api/consultants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteConsultant(id: number) {
  const response = await fetch(apiUrl(`/api/consultants/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete consultant");
  }
}

export async function getSiteContent() {
  const data = await request<SiteContentRecord>("/api/site-content", {
    method: "GET",
  });
  return normalizeSiteContentRecord(data);
}

export async function updateSiteContent(payload: SiteContentRecord) {
  return request<SiteContentRecord>("/api/site-content", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createAppointment(payload: AppointmentPayload) {
  return request<AppointmentRecord>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAppointments() {
  return request<AppointmentRecord[]>("/api/appointments", {
    method: "GET",
  });
}

export async function updateAppointment(
  appointmentId: number,
  payload: Partial<Pick<AppointmentRecord, "status" | "destination" | "assignedToUserId" | "preferredDate" | "preferredTime" | "notes">>,
) {
  return request<AppointmentRecord>(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAppointment(appointmentId: number) {
  const response = await fetch(apiUrl(`/api/appointments/${appointmentId}`), {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to delete appointment");
  }
}
