import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, type Collection } from "mongodb";

export type UserRole = "user" | "admin" | "owner";
export type InquiryStatus = "pending" | "contacted" | "resolved";
export type LeadStage = "new" | "contacted" | "counseling" | "documents" | "applied" | "visa" | "converted" | "lost";
export type AppointmentStatus = "requested" | "scheduled" | "completed" | "cancelled";
export type InviteStatus = "pending" | "accepted" | "revoked";
export type DocumentStatus = "uploaded" | "reviewing" | "approved" | "rejected";
export type NotificationChannel = "email" | "whatsapp" | "both";

export interface UserRecord {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  passwordHash?: string | null;
  createdAt: string;
}

export interface InquiryRecord {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  leadStage: LeadStage;
  assignedToUserId: string | null;
  assignedToName: string | null;
  followUpAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ProgramRecord {
  id: number;
  title: string;
  description: string;
  country: string;
  duration: string;
  imageUrl: string | null;
  featured: boolean;
  createdAt: string;
}

export interface GalleryImageRecord {
  id: number;
  url: string;
  caption: string | null;
  category: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TestimonialRecord {
  id: number;
  studentName: string;
  country: string;
  program: string | null;
  message: string;
  avatarUrl: string | null;
  rating: number;
  featured: boolean;
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

export interface ConsultantRecord {
  id: number;
  name: string;
  role: string;
  specialty: string;
  experience: string;
  imageUrl: string | null;
  bio: string;
  countries: string[];
  languages: string[];
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface AppointmentRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  destination: string | null;
  preferredDate: string;
  preferredTime: string;
  notes: string | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface SiteMetricRecord {
  value: string;
  label: string;
}

export interface SiteServiceRecord {
  title: string;
  text: string;
}

export interface SiteContentRecord {
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  metrics: SiteMetricRecord[];
  mentorshipTitle: string;
  mentorshipSubtitle: string;
  services: SiteServiceRecord[];
  aboutTitle: string;
  aboutText: string;
  aboutHighlights: string[];
  contactTitle: string;
  contactText: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
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
  actorUserId: string | null;
  actorName: string;
  actorRole: UserRole | "system";
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface AdminInviteRecord {
  id: string;
  email: string;
  role: UserRole;
  status: InviteStatus;
  invitedByUserId: string | null;
  invitedByName: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface NotificationTemplateRecord {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject: string;
  message: string;
  updatedAt: string;
}

export interface StudentDocumentRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  fileName: string;
  fileUrl: string;
  contentType: string;
  sizeBytes: number;
  status: DocumentStatus;
  note: string | null;
  uploadedAt: string;
}

export interface AppStore {
  users: UserRecord[];
  inquiries: InquiryRecord[];
  programs: ProgramRecord[];
  gallery: GalleryImageRecord[];
  testimonials: TestimonialRecord[];
  destinations: DestinationRecord[];
  consultants: ConsultantRecord[];
  siteContent: SiteContentRecord;
  appointments: AppointmentRecord[];
  ownerSettings: OwnerSettingsRecord;
  auditLogs: AuditLogRecord[];
  adminInvites: AdminInviteRecord[];
  notificationTemplates: NotificationTemplateRecord[];
  studentDocuments: StudentDocumentRecord[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const dataFile = path.join(dataDir, "db.json");
const mongoStoreId = "app-store";
const mongoDatabaseName = process.env.MONGODB_DB || "nextstep";
const mongoCollectionName = process.env.MONGODB_COLLECTION || "app_store";

type MongoStoreDocument = AppStore & { _id: string };

let mongoClientPromise: Promise<MongoClient> | null = null;

const seedStore: AppStore = {
  users: [
    {
      id: "1",
      clerkId: "local-admin",
      email: "admin@nextstep.local",
      name: "NextStep Admin",
      phone: null,
      role: "owner",
      passwordHash: null,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  inquiries: [],
  programs: [
    {
      id: 1,
      title: "MBA in Canada",
      description: "Career-focused MBA pathways in top Canadian business schools.",
      country: "Canada",
      duration: "2 Years",
      imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 2,
      title: "MS in Australia",
      description: "Industry-aligned postgraduate programs with strong internship options.",
      country: "Australia",
      duration: "2 Years",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  gallery: [],
  testimonials: [],
  appointments: [],
  consultants: [],
  destinations: [],
  siteContent: {
    heroTitle: "Your global future",
    heroAccent: "starts here.",
    heroSubtitle:
      "We do not just process visas; we architect futures. Partner with passionate mentors dedicated to guiding you to the world's top universities.",
    primaryCta: "Get Free Assessment",
    secondaryCta: "Explore Services",
    metrics: [
      { value: "15+", label: "Years Experience" },
      { value: "10k+", label: "Students Placed" },
      { value: "25+", label: "Countries" },
      { value: "98%", label: "Success Rate" },
    ],
    mentorshipTitle: "A Mentorship Approach",
    mentorshipSubtitle:
      "We go beyond the paperwork. Our advisors are deeply committed to understanding your aspirations and matching you with institutions where you will thrive.",
    services: [
      {
        title: "Personalized Mentorship",
        text: "You are paired with a dedicated consultant who understands your goals and guides every step of the journey.",
      },
      {
        title: "Global Network",
        text: "Direct guidance across leading study destinations including Canada, the UK, Australia, Europe, and the USA.",
      },
      {
        title: "End-to-End Support",
        text: "From university selection and essays to visa readiness, interviews, and pre-departure preparation.",
      },
    ],
    aboutTitle: "Built for serious study abroad decisions.",
    aboutText:
      "Our counseling process blends destination research, admission strategy, scholarship planning, and visa preparation into one guided path.",
    aboutHighlights: [
      "Course shortlisting",
      "Scholarship strategy",
      "Visa documentation",
      "Pre-departure briefing",
    ],
    contactTitle: "Ready to start your assessment?",
    contactText:
      "Book a free consultation and get a practical roadmap for destination selection, admissions, scholarships, and visa preparation.",
    contactEmail: "info@nextstepglobal.edu",
    contactPhone: "+91 1800 123 4567",
    footerTagline: "Global education guidance shaped by mentorship, clarity, and long-term student outcomes.",
  },
  ownerSettings: {
    companyName: "NextStep Global",
    ownerName: "NextStep Owner",
    supportEmail: "info@nextstepglobal.edu",
    supportPhone: "+91 1800 123 4567",
    timezone: "Asia/Kolkata",
    defaultCounselorMessage: "Thank you for your inquiry. A counselor will reach out soon.",
    brandTagline: "Study abroad planning with structure, care, and momentum.",
  },
  auditLogs: [],
  adminInvites: [],
  notificationTemplates: [],
  studentDocuments: [],
};

let writeChain = Promise.resolve();

function cloneStore(store: AppStore): AppStore {
  return JSON.parse(JSON.stringify(store)) as AppStore;
}

export function createAuditLogEntry(input: {
  actorUserId?: string | null;
  actorName: string;
  actorRole: UserRole | "system";
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}): AuditLogRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    actorUserId: input.actorUserId ?? null,
    actorName: input.actorName,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    createdAt: new Date().toISOString(),
  };
}

function isMongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI?.trim());
}

async function getMongoCollection(): Promise<Collection<MongoStoreDocument>> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(uri).connect();
  }

  const client = await mongoClientPromise;
  return client.db(mongoDatabaseName).collection<MongoStoreDocument>(mongoCollectionName);
}

async function readLocalStoreOrSeed(): Promise<AppStore> {
  try {
    const store = JSON.parse(await readFile(dataFile, "utf8")) as AppStore;
    return store;
  } catch {
    return cloneStore(seedStore);
  }
}

async function writeLocalStore(store: AppStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

async function writeMongoStore(store: AppStore): Promise<void> {
  const collection = await getMongoCollection();
  await collection.updateOne({ _id: mongoStoreId }, { $set: store, $setOnInsert: { _id: mongoStoreId } }, { upsert: true });
}

async function persistStore(store: AppStore): Promise<void> {
  if (isMongoEnabled()) {
    await writeMongoStore(store);
    return;
  }

  await writeLocalStore(store);
}

async function ensureStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedStore, null, 2), "utf8");
  }
}

export async function readStore(): Promise<AppStore> {
  if (isMongoEnabled()) {
    const collection = await getMongoCollection();
    const document = await collection.findOne({ _id: mongoStoreId });

    if (!document) {
      const migratedStore = await readLocalStoreOrSeed();
      await writeMongoStore(migratedStore);
      return migratedStore;
    }

    const { _id: _ignored, ...store } = document;
    return store as AppStore;
  }

  await ensureStore();
  const store = JSON.parse(await readFile(dataFile, "utf8")) as AppStore;
  return store;
}

export async function updateStore<T>(updater: (store: AppStore) => T): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = updater(store);
    await persistStore(store);
    return result;
  };

  const next = writeChain.then(run, run);
  writeChain = next.then(() => undefined, () => undefined);
  return next;
}

export function nextNumericId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}
