import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient, type Collection, type Db } from "mongodb";

export type UserRole = "user" | "admin" | "manager" | "owner";
export type InquiryStatus = "pending" | "contacted" | "resolved";
export type LeadStage = "new" | "contacted" | "counseling" | "documents" | "applied" | "offer" | "visa" | "enrolled" | "lost";
export type AppointmentStatus = "requested" | "scheduled" | "completed" | "cancelled";
export type InviteStatus = "pending" | "accepted" | "revoked";
export type DocumentStatus = "uploaded" | "reviewing" | "approved" | "rejected";
export type NotificationChannel = "email" | "whatsapp" | "both";
export type MeetingType = "phone" | "video" | "office";
export type ProgramLevel = "undergraduate" | "postgraduate" | "research" | "diploma" | "any";

export interface UserRecord {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  positionId?: string | null;
  positionName?: string | null;
  reportsToUserId?: string | null;
  reportsToName?: string | null;
  passwordHash?: string | null;
  createdAt: string;
}

export type AdminUserRecord = UserRecord;

export interface UserPositionRecord {
  id: string;
  name: string;
  level: number;
  description: string | null;
  reportsToPositionId: string | null;
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
  leadScore?: number;
  destination: string | null;
  programLevel: ProgramLevel | null;
  intake: string | null;
  lastContactedAt: string | null;
  visaReadinessScore: number;
  createdAt: string;
}

export interface ProgramRecord {
  id: number;
  title: string;
  description: string;
  country: string;
  duration: string;
  imageUrl: string | null;
  tuitionFee: string | null;
  intakeMonths: string[];
  eligibility: string | null;
  englishRequirement: string | null;
  applicationDeadline: string | null;
  scholarshipAvailable: boolean;
  careerOutcomes: string[];
  featured: boolean;
  createdAt: string;
}

export interface GalleryImageRecord {
  id: number;
  name?: string | null;
  url: string;
  caption: string | null;
  category: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  uploadedByUserId?: string | null;
  uploadedByName?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string | null;
}

export type MediaFileRecord = GalleryImageRecord;

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
  consultantId: number | null;
  consultantName: string | null;
  meetingType: MeetingType;
  assignedToUserId: string | null;
  assignedToName: string | null;
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

export interface SiteFaqRecord {
  question: string;
  answer: string;
}

export interface SiteIntakeRecord {
  intake: string;
  deadline: string;
  description: string;
}

export interface SiteContentRecord {
  heroTitle: string;
  heroAccent: string;
  heroSubtitle: string;
  brandLogoUrl: string | null;
  heroBackgroundImage: string | null;
  heroRightImage: string | null;
  primaryCta: string;
  secondaryCta: string;
  metrics: SiteMetricRecord[];
  mentorshipTitle: string;
  mentorshipSubtitle: string;
  services: SiteServiceRecord[];
  faqs: SiteFaqRecord[];
  intakeTimeline: SiteIntakeRecord[];
  aboutTitle: string;
  aboutText: string;
  aboutHighlights: string[];
  contactTitle: string;
  contactText: string;
  contactEmail: string;
  contactPhone: string;
  footerTagline: string;
}

export type CmsPageStatus = "draft" | "published";

export interface CmsSeoRecord {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  seoImage: string | null;
}

export interface CmsHeroRecord {
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string | null;
  backgroundVideo: string | null;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  visible: boolean;
}

export interface CmsSectionRecord {
  id: string;
  title: string;
  subtitle: string;
  richText: string;
  images: string[];
  videos: string[];
  icons: string[];
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  order: number;
  enabled: boolean;
}

export interface CmsCardRecord {
  id: string;
  image: string | null;
  icon: string;
  title: string;
  description: string;
  link: string;
  order: number;
  active: boolean;
}

export interface CmsFaqRecord {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface CmsTestimonialRecord {
  id: string;
  clientName: string;
  designation: string;
  review: string;
  rating: number;
  photo: string | null;
}

export interface CmsGalleryItemRecord {
  id: string;
  image: string;
  caption: string;
  order: number;
}

export interface CmsCtaRecord {
  heading: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
}

export interface CmsVersionRecord {
  id: string;
  savedAt: string;
  savedBy: string;
  status: CmsPageStatus;
  title: string;
}

export interface CmsPageRecord {
  id: string;
  title: string;
  slug: string;
  url: string;
  seo: CmsSeoRecord;
  hero: CmsHeroRecord;
  sections: CmsSectionRecord[];
  cards: CmsCardRecord[];
  faqs: CmsFaqRecord[];
  testimonials: CmsTestimonialRecord[];
  gallery: CmsGalleryItemRecord[];
  cta: CmsCtaRecord;
  footerText: string;
  status: CmsPageStatus;
  scheduledPublishAt: string | null;
  visible: boolean;
  versionHistory: CmsVersionRecord[];
  createdAt: string;
  updatedAt: string;
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

export type ActivityLogRecord = AuditLogRecord;

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
  purpose?: string | null;
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
  documentType: string | null;
  checklistItemId: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  note: string | null;
  uploadedAt: string;
}

export interface ScholarshipRecord {
  id: number;
  name: string;
  country: string;
  programLevel: ProgramLevel;
  eligibility: string;
  awardValue: string;
  deadline: string;
  intake: string | null;
  applicationLink: string | null;
  active: boolean;
  createdAt: string;
}

export interface DocumentChecklistItemRecord {
  id: string;
  label: string;
  required: boolean;
}

export interface DocumentChecklistTemplateRecord {
  id: number;
  destination: string;
  programLevel: ProgramLevel;
  title: string;
  items: DocumentChecklistItemRecord[];
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  inquiryId: number | null;
  studentEmail: string;
  studentUserId: string | null;
  senderUserId: string | null;
  senderName: string;
  senderRole: UserRole | "system";
  body: string;
  createdAt: string;
}

export type ChatConversationType = "direct" | "group";

export interface ChatConversationRecord {
  id: string;
  type: ChatConversationType;
  title: string;
  createdByUserId: string | null;
  createdByName: string;
  memberUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  senderName: string;
  senderRole: UserRole | "system";
  body: string;
  createdAt: string;
}

export interface AppStore {
  users: UserRecord[];
  userPositions: UserPositionRecord[];
  inquiries: InquiryRecord[];
  programs: ProgramRecord[];
  gallery: GalleryImageRecord[];
  testimonials: TestimonialRecord[];
  destinations: DestinationRecord[];
  consultants: ConsultantRecord[];
  siteContent: SiteContentRecord;
  cmsPages: CmsPageRecord[];
  appointments: AppointmentRecord[];
  ownerSettings: OwnerSettingsRecord;
  auditLogs: AuditLogRecord[];
  adminInvites: AdminInviteRecord[];
  notificationTemplates: NotificationTemplateRecord[];
  studentDocuments: StudentDocumentRecord[];
  scholarships: ScholarshipRecord[];
  documentChecklistTemplates: DocumentChecklistTemplateRecord[];
  messages: MessageRecord[];
  chatConversations: ChatConversationRecord[];
  chatMessages: ChatMessageRecord[];
  roleMenuAccess: {
    admin: string[];
    userPortal: string[];
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../../data");
const dataFile = path.join(dataDir, "db.json");
const mongoStoreId = "app-store";
const mongoDatabaseName = process.env.MONGODB_DB || "nextstep";
const mongoCollectionName = process.env.MONGODB_COLLECTION || "app_store";

type MongoStoreDocument = AppStore & { _id: string };

let mongoClientPromise: Promise<MongoClient> | null = null;

export function isMongoAuthError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 8000
  );
}

function normalizeStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeSiteMetrics(value: unknown, fallback: SiteMetricRecord[]): SiteMetricRecord[] {
  if (!Array.isArray(value)) {
    return cloneStore({ ...seedStore, siteContent: { ...seedStore.siteContent, metrics: fallback } }).siteContent.metrics;
  }

  const normalized = value
    .map((metric) => ({
      value: typeof metric?.value === "string" ? metric.value : "",
      label: typeof metric?.label === "string" ? metric.label : "",
    }))
    .filter((metric) => metric.value || metric.label);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeSiteServices(value: unknown, fallback: SiteServiceRecord[]): SiteServiceRecord[] {
  if (!Array.isArray(value)) {
    return cloneStore({ ...seedStore, siteContent: { ...seedStore.siteContent, services: fallback } }).siteContent.services;
  }

  const normalized = value
    .map((service) => ({
      title: typeof service?.title === "string" ? service.title : "",
      text: typeof service?.text === "string" ? service.text : "",
    }))
    .filter((service) => service.title || service.text);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeSiteFaqs(value: unknown, fallback: SiteFaqRecord[]): SiteFaqRecord[] {
  if (!Array.isArray(value)) {
    return cloneStore({ ...seedStore, siteContent: { ...seedStore.siteContent, faqs: fallback } }).siteContent.faqs;
  }

  const normalized = value
    .map((faq) => ({
      question: typeof faq?.question === "string" ? faq.question : "",
      answer: typeof faq?.answer === "string" ? faq.answer : "",
    }))
    .filter((faq) => faq.question || faq.answer);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeSiteIntakes(value: unknown, fallback: SiteIntakeRecord[]): SiteIntakeRecord[] {
  if (!Array.isArray(value)) {
    return cloneStore({ ...seedStore, siteContent: { ...seedStore.siteContent, intakeTimeline: fallback } }).siteContent.intakeTimeline;
  }

  const normalized = value
    .map((intake) => ({
      intake: typeof intake?.intake === "string" ? intake.intake : "",
      deadline: typeof intake?.deadline === "string" ? intake.deadline : "",
      description: typeof intake?.description === "string" ? intake.description : "",
    }))
    .filter((intake) => intake.intake || intake.deadline || intake.description);

  return normalized.length > 0 ? normalized : fallback;
}

const nowSeed = "2026-06-01T00:00:00.000Z";

function createSeedCmsPage(input: {
  title: string;
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  cards?: Array<{ title: string; description: string; icon?: string; link?: string }>;
}): CmsPageRecord {
  const url = input.slug === "home" ? "/" : `/${input.slug}`;
  return {
    id: `cms-${input.slug}`,
    title: input.title,
    slug: input.slug,
    url,
    seo: {
      metaTitle: `${input.title} | NextStep Global`,
      metaDescription: input.description,
      metaKeywords: `NextStep Global, ${input.title}, study abroad, education services`,
      seoImage: "/nextstep-logo.png",
    },
    hero: {
      title: input.heroTitle,
      subtitle: input.heroSubtitle,
      description: input.description,
      backgroundImage: input.slug === "home" ? "/hero-student.jpg" : null,
      backgroundVideo: null,
      primaryButtonText: "Ask an Advisor",
      primaryButtonLink: "/contact",
      secondaryButtonText: "Explore Programs",
      secondaryButtonLink: "/programs",
      visible: true,
    },
    sections: [
      {
        id: `section-${input.slug}-overview`,
        title: input.title,
        subtitle: input.heroSubtitle,
        richText: input.description,
        images: [],
        videos: [],
        icons: [],
        buttonText: "Talk to Advisor",
        buttonLink: "/contact",
        backgroundColor: "#ffffff",
        order: 1,
        enabled: true,
      },
    ],
    cards: (input.cards || []).map((card, index) => ({
      id: `card-${input.slug}-${index + 1}`,
      image: null,
      icon: card.icon || "Globe",
      title: card.title,
      description: card.description,
      link: card.link || "/contact",
      order: index + 1,
      active: true,
    })),
    faqs: [
      {
        id: `faq-${input.slug}-1`,
        question: `How can NextStep Global help with ${input.title.toLowerCase()}?`,
        answer: "Our advisors explain options, timelines, documents, and next steps based on the student's profile.",
        order: 1,
      },
    ],
    testimonials: [],
    gallery: [],
    cta: {
      heading: "Not sure what to choose?",
      description: "Our experts can help you compare options and create a practical application roadmap.",
      buttonText: "Talk to Advisor",
      buttonLink: "/contact",
      backgroundColor: "#07162f",
    },
    footerText: "NextStep Global Educational Services helps students plan practical international education pathways.",
    status: "published",
    scheduledPublishAt: null,
    visible: true,
    versionHistory: [],
    createdAt: nowSeed,
    updatedAt: nowSeed,
  };
}

const seedStore: AppStore = {
  users: [
    {
      id: "1",
      clerkId: "local-admin",
      email: "admin@nextstep.local",
      name: "NextStep Admin",
      phone: null,
      role: "owner",
      positionId: null,
      positionName: null,
      reportsToUserId: null,
      reportsToName: null,
      passwordHash: null,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  userPositions: [
    {
      id: "senior-counselor",
      name: "Senior Counselor",
      level: 2,
      description: "Handles counseling ownership, student follow-up, and application planning.",
      reportsToPositionId: null,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: "document-reviewer",
      name: "Document Reviewer",
      level: 3,
      description: "Reviews uploaded student documents and keeps checklist status updated.",
      reportsToPositionId: "senior-counselor",
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
      tuitionFee: "CAD 18,000 - 36,000/year",
      intakeMonths: ["January", "May", "September"],
      eligibility: "Bachelor degree with 55% or above; work experience preferred for MBA pathways.",
      englishRequirement: "IELTS 6.5 overall or equivalent accepted English test.",
      applicationDeadline: "Apply 4-6 months before intake",
      scholarshipAvailable: true,
      careerOutcomes: ["Business Analyst", "Marketing Manager", "Operations Lead", "Entrepreneurship"],
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
      tuitionFee: "AUD 24,000 - 42,000/year",
      intakeMonths: ["February", "July", "November"],
      eligibility: "Bachelor degree in relevant stream with strong academic records.",
      englishRequirement: "IELTS 6.5 overall or PTE equivalent.",
      applicationDeadline: "Apply 5-7 months before intake",
      scholarshipAvailable: true,
      careerOutcomes: ["Software Engineer", "Data Analyst", "Research Assistant", "Project Coordinator"],
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  gallery: [],
  testimonials: [],
  appointments: [],
  consultants: [
    {
      id: 1,
      name: "Priya Sharma",
      role: "Senior Education Consultant",
      specialty: "Canada and visa planning",
      experience: "12 Years",
      imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
      bio:
        "Priya helps students match their academic profile with Canadian universities, funding options, and post-study pathways.",
      countries: ["Canada", "United Kingdom"],
      languages: ["English", "Hindi", "Telugu"],
      featured: true,
      sortOrder: 1,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 2,
      name: "Rahul Mehta",
      role: "Visa Strategy Mentor",
      specialty: "Australia and New Zealand admissions",
      experience: "8 Years",
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop",
      bio:
        "Rahul focuses on practical course shortlisting, documentation readiness, and student visa interview preparation.",
      countries: ["Australia", "New Zealand"],
      languages: ["English", "Hindi"],
      featured: true,
      sortOrder: 2,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 3,
      name: "Dr. Ananya Krishnan",
      role: "Research Pathway Advisor",
      specialty: "Europe, Germany, and research programs",
      experience: "10 Years",
      imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop",
      bio:
        "Ananya guides postgraduate and research applicants through university fit, statements of purpose, and supervisor outreach.",
      countries: ["Germany", "Europe", "United States"],
      languages: ["English", "Hindi", "Malayalam"],
      featured: true,
      sortOrder: 3,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  destinations: [
    {
      id: 1,
      slug: "united-kingdom",
      code: "GB",
      name: "United Kingdom",
      description:
        "The UK is home to some of the world's most prestigious universities, offering world-class education, a rich cultural experience, and strong graduate outcomes.",
      overview:
        "The UK combines globally respected degrees, shorter course durations, and strong links to industry. Students benefit from a rich academic culture, international campuses, and practical graduate routes.",
      highlights: [
        "World-renowned universities",
        "Post-Study Work Visa up to 2 years",
        "Rich academic tradition",
        "Diverse multicultural environment",
        "Strong research opportunities",
      ],
      universities: ["University of Oxford", "University of Cambridge", "Imperial College London", "UCL", "University of Edinburgh"],
      tuition: "GBP 15,000 - 35,000/year",
      requirements: ["IELTS/TOEFL or accepted English test", "Academic transcripts", "Statement of purpose", "References", "Financial documents"],
      workOptions: ["Up to 20 hours/week during term", "Full-time during eligible breaks", "Graduate Route after studies"],
      accent: "from-blue-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 2,
      slug: "united-states",
      code: "US",
      name: "United States",
      description:
        "The USA offers unmatched academic resources, research funding, flexible course choices, and career opportunities at globally recognized institutions.",
      overview:
        "The USA offers unparalleled academic resources, research funding, and career opportunities at globally recognized institutions. International students benefit from vibrant campus life and extensive alumni networks.",
      highlights: [
        "Top-ranked universities worldwide",
        "CPT and OPT work opportunities",
        "Diverse program offerings",
        "Cutting-edge research facilities",
        "Strong entrepreneurship ecosystem",
      ],
      universities: ["MIT", "Harvard University", "Stanford University", "Caltech", "University of Chicago"],
      tuition: "USD 20,000 - 55,000/year",
      requirements: ["SAT/ACT or GRE/GMAT where required", "IELTS/TOEFL or Duolingo", "Academic transcripts", "Statement of purpose", "Financial documents"],
      workOptions: ["On-campus work options", "CPT during eligible programs", "OPT after graduation"],
      accent: "from-rose-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 3,
      slug: "canada",
      code: "CA",
      name: "Canada",
      description:
        "Canada is a leading destination for international students thanks to welcoming immigration pathways, high quality of life, and practical work options.",
      overview:
        "Canada is known for safe cities, welcoming policies, respected universities, and strong post-study pathways. It is a practical option for students planning long-term settlement.",
      highlights: [
        "Post-Graduation Work Permit up to 3 years",
        "Pathway to permanent residency",
        "Safe and welcoming environment",
        "Affordable tuition compared with USA/UK",
        "Bilingual English and French culture",
      ],
      universities: ["University of Toronto", "McGill University", "University of British Columbia", "University of Waterloo", "McMaster University"],
      tuition: "CAD 15,000 - 35,000/year",
      requirements: ["IELTS/PTE/TOEFL", "Academic transcripts", "Statement of purpose", "GIC and financial proof", "Study permit documents"],
      workOptions: ["Part-time work during studies", "Co-op options in eligible programs", "PGWP after graduation"],
      accent: "from-emerald-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 4,
      slug: "australia",
      code: "AU",
      name: "Australia",
      description:
        "Australia combines globally respected universities with industry-linked education, excellent lifestyle, and practical post-study work routes.",
      overview:
        "Australia offers career-oriented degrees, vibrant student cities, and strong graduate work opportunities. It is especially popular for business, technology, healthcare, and research pathways.",
      highlights: [
        "Post-study work rights",
        "Strong internship options",
        "High quality of life",
        "Globally ranked universities",
        "Popular STEM and business pathways",
      ],
      universities: ["University of Melbourne", "Australian National University", "University of Sydney", "UNSW", "Monash University"],
      tuition: "AUD 22,000 - 45,000/year",
      requirements: ["IELTS/PTE/TOEFL", "Academic transcripts", "Genuine student documents", "Financial evidence", "Health cover"],
      workOptions: ["Part-time work during term", "Full-time during breaks", "Temporary graduate visa options"],
      accent: "from-amber-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 5,
      slug: "europe",
      code: "EU",
      name: "Europe",
      description:
        "Europe offers diverse English-taught programs, affordable tuition, cross-border mobility, and strong options across business, technology, and research.",
      overview:
        "Europe gives students access to affordable public education, English-taught degrees, strong research hubs, and a rich cross-cultural academic experience.",
      highlights: [
        "Affordable public universities",
        "English-taught degree options",
        "Schengen travel exposure",
        "Strong research and innovation hubs",
        "Multiple funding routes",
      ],
      universities: ["Technical University of Munich", "KU Leuven", "University of Amsterdam", "Sorbonne University", "Lund University"],
      tuition: "EUR 5,000 - 25,000/year",
      requirements: ["Academic transcripts", "English or local language proof", "Motivation letter", "CV", "Financial proof"],
      workOptions: ["Country-specific part-time work", "Internship pathways", "Post-study permits in selected countries"],
      accent: "from-cyan-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 6,
      slug: "new-zealand",
      code: "NZ",
      name: "New Zealand",
      description:
        "New Zealand is ideal for students who want focused universities, safety, work opportunities, and a calm environment for long-term growth.",
      overview:
        "New Zealand offers a safe study environment, research-led universities, and a balanced lifestyle. It suits students looking for focused programs and stable post-study options.",
      highlights: [
        "Student-friendly visa settings",
        "Safe study environment",
        "Research-led universities",
        "Good work-life balance",
        "Growing demand for skilled graduates",
      ],
      universities: ["University of Auckland", "University of Otago", "Victoria University of Wellington", "University of Canterbury", "Massey University"],
      tuition: "NZD 20,000 - 40,000/year",
      requirements: ["IELTS/PTE/TOEFL", "Academic transcripts", "Statement of purpose", "Financial evidence", "Health and character documents"],
      workOptions: ["Part-time work while studying", "Post-study work visa options", "Skilled employment pathways"],
      accent: "from-indigo-50 to-slate-50",
      featured: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  siteContent: {
    heroTitle: "future",
    heroAccent: "starts here.",
    heroSubtitle:
      "At NextStep Global Educational Services, we provide personalized guidance for students aspiring to study abroad. From university selection and admissions to scholarship assistance, visa processing, and pre-departure support, we're with you every step of the way.\n\nWe don't just process applications - we help shape your future. Partner with experienced mentors dedicated to guiding you toward the world's leading universities.",
    brandLogoUrl: "/nextstep-logo.png",
    heroBackgroundImage: null,
    heroRightImage: null,
    primaryCta: "Get Free Assessment",
    secondaryCta: "Explore Services",
    metrics: [
      { value: "9394+", label: "Enrolled Learners" },
      { value: "534+", label: "Universities" },
      { value: "643+", label: "Global Offices" },
      { value: "100%", label: "Free Services" },
    ],
    mentorshipTitle: "Our Services",
    mentorshipSubtitle:
      "We guide students through admissions, funding planning, visa preparation, and financial documentation with practical support at every step.",
    services: [
      {
        title: "College & University Admission",
        text: "College and university admission processes are simplified with expert guidance.",
      },
      {
        title: "Funding Guidance",
        text: "Funding guidance helps students identify financial support for international education.",
      },
      {
        title: "Financial Documentation Guidance",
        text: "Financial documentation guidance helps students prepare proper records for admission and visa processing.",
      },
      {
        title: "Career Counselling",
        text: "Education counsellors learn about student goals and recommend practical academic pathways.",
      },
      {
        title: "Visa Services",
        text: "Visa services support students with processing, documentation, and interview readiness.",
      },
      {
        title: "Test Preparation Classes",
        text: "Test preparation classes help improve exam confidence and readiness.",
      },
    ],
    intakeTimeline: [
      {
        intake: "January 2026",
        deadline: "Apply by August - October 2025",
        description: "Best for students who already have documents ready and want an early-year start.",
      },
      {
        intake: "May 2026",
        deadline: "Apply by December 2025 - February 2026",
        description: "Useful for students waiting for final semester results or English test scores.",
      },
      {
        intake: "September 2026",
        deadline: "Apply by March - June 2026",
        description: "Major intake with the widest university and funding availability.",
      },
    ],
    faqs: [
      {
        question: "Can I apply without IELTS?",
        answer: "Some universities accept MOI, Duolingo, PTE, or internal English assessment. It depends on the country, university, and program.",
      },
      {
        question: "When should I start my study abroad application?",
        answer: "Start at least 6-9 months before your target intake so there is enough time for shortlisting, documents, applications, funding planning, and visa preparation.",
      },
      {
        question: "Do you help with funding options?",
        answer: "Yes. We help identify early application discounts, fee waivers, assistantships, and university-specific funding options.",
      },
      {
        question: "What documents are usually required?",
        answer: "Common documents include transcripts, passport, English test score, SOP, LORs, resume, financial proof, and country-specific visa documents.",
      },
    ],
    aboutTitle: "Welcome to NextStep Global",
    aboutText:
      "NextStep Global is a London-based education consultancy dedicated to linking international students with prestigious global universities, offering expertise across law, medicine, business, and other academic fields.",
    aboutHighlights: [
      "College & University Admission",
      "Funding Guidance",
      "Career Counselling",
      "Professional Consulate for Visa Processing",
      "Financial Documentation Guidance",
    ],
    contactTitle: "Have Any Questions About Studying Abroad?",
    contactText:
      "Contact us today for admission guidance, destination selection, and visa preparation support.",
    contactEmail: "hello@nextstepglobal.net",
    contactPhone: "+8801758 580909",
    footerTagline: "NextStep Global is a London-based education consultancy dedicated to linking international students with prestigious global universities.",
  },
  cmsPages: [
    createSeedCmsPage({
      title: "Home",
      slug: "home",
      heroTitle: "Your global future starts here.",
      heroSubtitle: "Explore world-class education opportunities across top destinations.",
      description: "Explore practical study pathways built around your academic profile, budget, and long-term career plans.",
      cards: [
        { title: "Global Universities", description: "Top ranked institutions matched to your profile.", icon: "University" },
        { title: "Expert Advisors", description: "One-to-one personalized admission guidance.", icon: "Users" },
        { title: "Visa Assistance", description: "Documentation and readiness support.", icon: "Shield" },
      ],
    }),
    createSeedCmsPage({
      title: "Services",
      slug: "services",
      heroTitle: "Study abroad services built around your goals.",
      heroSubtitle: "Admissions, funding, visa, and pre-departure support in one managed flow.",
      description: "Manage every service page section, card, FAQ, testimonial, gallery item, CTA, and SEO setting from the CMS.",
      cards: [
        { title: "Admission Counselling", description: "Shortlist universities and courses with practical guidance.", icon: "GraduationCap" },
        { title: "Funding Guidance", description: "Plan fees, documents, and realistic financial support options.", icon: "Wallet" },
        { title: "Visa Documentation", description: "Prepare visa paperwork and interview readiness.", icon: "FileCheck" },
      ],
    }),
    createSeedCmsPage({
      title: "Destinations",
      slug: "destinations",
      heroTitle: "Compare destinations before you apply.",
      heroSubtitle: "Choose the right country based on course fit, budget, work rights, and long-term plans.",
      description: "Use this CMS page to manage destination page hero, SEO, sections, cards, FAQs, gallery, CTA, and footer text.",
      cards: [
        { title: "USA", description: "Research-led universities and STEM pathways.", icon: "Flag" },
        { title: "UK", description: "Fast masters and strong employability.", icon: "Flag" },
        { title: "Canada", description: "Affordable programs and immigration options.", icon: "Flag" },
      ],
    }),
    createSeedCmsPage({
      title: "Consultants",
      slug: "consultants",
      heroTitle: "Meet advisors who understand your next step.",
      heroSubtitle: "Connect with destination specialists and admission mentors.",
      description: "Create consultant page sections, advisor cards, testimonials, FAQs, CTA content, and page SEO from one place.",
      cards: [
        { title: "Destination Specialists", description: "Country-specific guidance for admissions and visas.", icon: "MapPin" },
        { title: "Application Mentors", description: "Support for SOP, LOR, resume, and application timelines.", icon: "ClipboardCheck" },
      ],
    }),
    createSeedCmsPage({
      title: "About",
      slug: "about",
      heroTitle: "Built for serious study abroad decisions.",
      heroSubtitle: "A student-first education consultancy with practical, transparent guidance.",
      description: "Tell your story, highlight values, add media, publish testimonials, and control page SEO from the CMS.",
    }),
    createSeedCmsPage({
      title: "Contact",
      slug: "contact",
      heroTitle: "Ready to start your assessment?",
      heroSubtitle: "Book a free consultation and get a practical roadmap.",
      description: "Manage contact page copy, CTA sections, FAQ, gallery, testimonials, footer text, and SEO settings.",
    }),
    createSeedCmsPage({
      title: "Portal",
      slug: "portal",
      heroTitle: "Student portal for every application step.",
      heroSubtitle: "Track inquiries, programs, documents, appointments, and messages.",
      description: "Edit the portal landing page content and guidance shown before sign-in.",
      cards: [
        { title: "Documents", description: "Upload and track student documents.", icon: "FileText" },
        { title: "Appointments", description: "Manage meetings and reminders.", icon: "Calendar" },
        { title: "Messages", description: "Stay connected with advisors.", icon: "MessageCircle" },
      ],
    }),
  ],
  ownerSettings: {
    companyName: "NextStep Global",
    ownerName: "NextStep Owner",
    supportEmail: "hello@nextstepglobal.net",
    supportPhone: "+8801758 580909",
    timezone: "Asia/Dhaka",
    defaultCounselorMessage: "Thank you for your inquiry. A counselor will reach out soon.",
    brandTagline: "Study abroad planning with structure, care, and momentum.",
  },
  auditLogs: [],
  adminInvites: [],
  notificationTemplates: [
    {
      id: "welcome-email",
      name: "Welcome Follow Up",
      channel: "email",
      purpose: "general",
      subject: "Your NextStep consultation request",
      message: "Hi {{name}},\n\nThank you for reaching out. Our team will review your goals and contact you shortly.\n\nRegards,\nNextStep",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: "docs-reminder",
      name: "Document Reminder",
      channel: "both",
      purpose: "general",
      subject: "Document checklist reminder",
      message: "Hi {{name}},\n\nThis is a reminder to upload your pending documents so we can continue your application process.",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: "inquiry-email-reply",
      name: "Inquiry Email Reply",
      channel: "email",
      purpose: "inquiry_email",
      subject: "NextStep Global - {{subject}}",
      message:
        "Hi {{name}},\n\nThank you for contacting NextStep Global.\nWe received your inquiry about \"{{subject}}\".\n\nOur counselor will guide you with course selection, admission process, funding planning, visa documentation, and next steps.\n\nPlease share your preferred study destination, current qualification, and intake timeline so we can assist you better.\n\nRegards,\nNextStep Global",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: "inquiry-whatsapp-reply",
      name: "Inquiry WhatsApp Reply",
      channel: "whatsapp",
      purpose: "inquiry_whatsapp",
      subject: "NextStep Global inquiry reply",
      message:
        "Hi {{name}},\n\nThank you for contacting NextStep Global. We received your inquiry about \"{{subject}}\".\n\nOur counselor will guide you with course selection, admission process, funding planning, visa documentation, and next steps.\n\nPlease share your preferred study destination, current qualification, and intake timeline so we can assist you better.\n\nRegards,\nNextStep Global",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  studentDocuments: [],
  scholarships: [
    {
      id: 1,
      name: "Global Merit Award",
      country: "Canada",
      programLevel: "postgraduate",
      eligibility: "Strong academics, complete application file, and English proficiency evidence.",
      awardValue: "Up to CAD 5,000",
      deadline: "2026-09-30",
      intake: "January 2027",
      applicationLink: "https://nextstepglobal.net/scholarships",
      active: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 2,
      name: "Early Application Tuition Grant",
      country: "United Kingdom",
      programLevel: "any",
      eligibility: "Students applying before priority deadline with complete academic documents.",
      awardValue: "GBP 1,000 - 3,000",
      deadline: "2026-07-31",
      intake: "September 2026",
      applicationLink: "https://nextstepglobal.net/scholarships",
      active: true,
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  documentChecklistTemplates: [
    {
      id: 1,
      destination: "Canada",
      programLevel: "any",
      title: "Canada student visa checklist",
      items: [
        { id: "passport", label: "Passport", required: true },
        { id: "transcripts", label: "Academic transcripts", required: true },
        { id: "english-test", label: "IELTS/PTE/TOEFL score", required: true },
        { id: "financial-proof", label: "GIC or financial proof", required: true },
        { id: "sop", label: "Statement of purpose", required: true },
      ],
      createdAt: "2026-05-12T00:00:00.000Z",
    },
    {
      id: 2,
      destination: "Default",
      programLevel: "any",
      title: "General study abroad checklist",
      items: [
        { id: "passport", label: "Passport", required: true },
        { id: "transcripts", label: "Academic transcripts", required: true },
        { id: "english-test", label: "English test score", required: false },
        { id: "sop", label: "Statement of purpose", required: true },
        { id: "financial-documents", label: "Financial documents", required: true },
      ],
      createdAt: "2026-05-12T00:00:00.000Z",
    },
  ],
  messages: [],
  chatConversations: [],
  chatMessages: [],
  roleMenuAccess: {
    admin: [
      "dashboard",
      "pages",
      "content",
      "inquiries",
      "pipeline",
      "appointments",
      "consultants",
      "programs",
      "countries",
      "gallery",
      "media",
      "testimonials",
      "notifications",
      "chats",
      "templates",
      "documents",
      "checklists",
      "auditLogs",
    ],
    userPortal: ["hero", "profile", "inquiries", "programs", "documents", "appointments", "messages"],
  },
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

export function requireMongoEnabled(): void {
  if (!isMongoEnabled()) {
    throw new Error("MongoDB is required for file storage. Set MONGODB_URI before uploading files.");
  }
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(uri).connect();
  }

  const client = await mongoClientPromise;
  return client.db(mongoDatabaseName);
}

async function getMongoCollection(): Promise<Collection<MongoStoreDocument>> {
  const db = await getMongoDb();
  return db.collection<MongoStoreDocument>(mongoCollectionName);
}

function normalizeStore(store: AppStore): boolean {
  let changed = false;

  if (!store.destinations) {
    store.destinations = cloneStore(seedStore).destinations;
    changed = true;
  }
  if (!store.userPositions) {
    store.userPositions = cloneStore(seedStore).userPositions;
    changed = true;
  }
  if (!store.siteContent) {
    store.siteContent = cloneStore(seedStore).siteContent;
    changed = true;
  }
  if (!store.cmsPages) {
    store.cmsPages = cloneStore(seedStore).cmsPages;
    changed = true;
  }
  const seededCmsPages = cloneStore(seedStore).cmsPages;
  for (const seedPage of seededCmsPages) {
    if (!store.cmsPages.some((page) => page.slug === seedPage.slug)) {
      store.cmsPages.push(seedPage);
      changed = true;
    }
  }
  for (const page of store.cmsPages) {
    if (!page.id) page.id = `cms-${page.slug || Date.now()}`;
    if (!page.url) page.url = page.slug === "home" ? "/" : `/${page.slug}`;
    if (!page.seo) page.seo = { metaTitle: page.title, metaDescription: "", metaKeywords: "", seoImage: null };
    if (!page.hero) page.hero = createSeedCmsPage({ title: page.title, slug: page.slug, heroTitle: page.title, heroSubtitle: "", description: "" }).hero;
    if (!Array.isArray(page.sections)) page.sections = [];
    if (!Array.isArray(page.cards)) page.cards = [];
    if (!Array.isArray(page.faqs)) page.faqs = [];
    if (!Array.isArray(page.testimonials)) page.testimonials = [];
    if (!Array.isArray(page.gallery)) page.gallery = [];
    if (!page.cta) page.cta = createSeedCmsPage({ title: page.title, slug: page.slug, heroTitle: page.title, heroSubtitle: "", description: "" }).cta;
    if (!page.status) page.status = "draft";
    if (typeof page.visible !== "boolean") page.visible = true;
    if (!Array.isArray(page.versionHistory)) page.versionHistory = [];
    if (!page.createdAt) page.createdAt = new Date().toISOString();
    if (!page.updatedAt) page.updatedAt = page.createdAt;
  }
  if (!store.siteContent.aboutHighlights?.length) {
    store.siteContent.aboutHighlights = cloneStore(seedStore).siteContent.aboutHighlights;
    changed = true;
  }
  const seedSiteContent = cloneStore(seedStore).siteContent;
  const normalizedMetrics = normalizeSiteMetrics(store.siteContent.metrics, seedSiteContent.metrics);
  if (JSON.stringify(normalizedMetrics) !== JSON.stringify(store.siteContent.metrics)) {
    store.siteContent.metrics = normalizedMetrics;
    changed = true;
  }
  const normalizedServices = normalizeSiteServices(store.siteContent.services, seedSiteContent.services);
  if (JSON.stringify(normalizedServices) !== JSON.stringify(store.siteContent.services)) {
    store.siteContent.services = normalizedServices;
    changed = true;
  }
  const normalizedFaqs = normalizeSiteFaqs(store.siteContent.faqs, seedSiteContent.faqs);
  if (JSON.stringify(normalizedFaqs) !== JSON.stringify(store.siteContent.faqs)) {
    store.siteContent.faqs = normalizedFaqs;
    changed = true;
  }
  const normalizedIntakes = normalizeSiteIntakes(store.siteContent.intakeTimeline, seedSiteContent.intakeTimeline);
  if (JSON.stringify(normalizedIntakes) !== JSON.stringify(store.siteContent.intakeTimeline)) {
    store.siteContent.intakeTimeline = normalizedIntakes;
    changed = true;
  }
  const normalizedAboutHighlights = normalizeStringArray(store.siteContent.aboutHighlights, seedSiteContent.aboutHighlights);
  if (JSON.stringify(normalizedAboutHighlights) !== JSON.stringify(store.siteContent.aboutHighlights)) {
    store.siteContent.aboutHighlights = normalizedAboutHighlights;
    changed = true;
  }
  if (!store.siteContent.footerTagline) {
    store.siteContent.footerTagline = cloneStore(seedStore).siteContent.footerTagline;
    changed = true;
  }
  if (store.siteContent.brandLogoUrl === undefined) {
    store.siteContent.brandLogoUrl = cloneStore(seedStore).siteContent.brandLogoUrl;
    changed = true;
  }
  if (store.siteContent.heroBackgroundImage === undefined) {
    store.siteContent.heroBackgroundImage = cloneStore(seedStore).siteContent.heroBackgroundImage;
    changed = true;
  }
  if (store.siteContent.heroRightImage === undefined) {
    store.siteContent.heroRightImage = cloneStore(seedStore).siteContent.heroRightImage;
    changed = true;
  }
  if (!store.appointments) {
    store.appointments = [];
    changed = true;
  }
  if (!store.ownerSettings) {
    store.ownerSettings = cloneStore(seedStore).ownerSettings;
    changed = true;
  }
  if (!store.auditLogs) {
    store.auditLogs = [];
    changed = true;
  }
  if (!store.adminInvites) {
    store.adminInvites = [];
    changed = true;
  }
  if (!store.notificationTemplates) {
    store.notificationTemplates = cloneStore(seedStore).notificationTemplates;
    changed = true;
  }
  const seenTemplateIds = new Set<string>();
  for (const template of store.notificationTemplates) {
    if (!template.id || seenTemplateIds.has(template.id)) {
      template.id = `${template.id || "template"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      changed = true;
    }
    seenTemplateIds.add(template.id);
  }
  for (const seedTemplate of seedStore.notificationTemplates) {
    if (seedTemplate.purpose && !store.notificationTemplates.some((entry) => entry.purpose === seedTemplate.purpose)) {
      store.notificationTemplates.push({ ...seedTemplate });
      changed = true;
    }
  }
  if (!store.studentDocuments) {
    store.studentDocuments = [];
    changed = true;
  }
  if (!store.scholarships) {
    store.scholarships = cloneStore(seedStore).scholarships;
    changed = true;
  }
  if (!store.documentChecklistTemplates) {
    store.documentChecklistTemplates = cloneStore(seedStore).documentChecklistTemplates;
    changed = true;
  }
  if (!store.messages) {
    store.messages = [];
    changed = true;
  }
  if (!store.chatConversations) {
    store.chatConversations = [];
    changed = true;
  }
  if (!store.chatMessages) {
    store.chatMessages = [];
    changed = true;
  }
  for (const conversation of store.chatConversations) {
    if (!Array.isArray(conversation.memberUserIds)) {
      conversation.memberUserIds = [];
      changed = true;
    }
    conversation.memberUserIds = Array.from(new Set(conversation.memberUserIds.filter(Boolean)));
    if (!conversation.updatedAt) {
      conversation.updatedAt = conversation.createdAt;
      changed = true;
    }
    if (!conversation.type) {
      conversation.type = conversation.memberUserIds.length > 2 ? "group" : "direct";
      changed = true;
    }
  }
  if (!store.roleMenuAccess) {
    store.roleMenuAccess = cloneStore(seedStore).roleMenuAccess;
    changed = true;
  }
  if (!store.roleMenuAccess.userPortal) {
    store.roleMenuAccess.userPortal = cloneStore(seedStore).roleMenuAccess.userPortal;
    changed = true;
  }
  store.roleMenuAccess.admin = store.roleMenuAccess.admin.filter((menuId) => menuId !== "scholarships");
  store.roleMenuAccess.userPortal = store.roleMenuAccess.userPortal.filter((sectionId) => sectionId !== "scholarships");
  for (const menuId of ["pages", "media", "checklists", "chats", "auditLogs"]) {
    if (!store.roleMenuAccess.admin.includes(menuId)) {
      store.roleMenuAccess.admin.push(menuId);
      changed = true;
    }
  }
  for (const sectionId of ["appointments", "messages"]) {
    if (!store.roleMenuAccess.userPortal.includes(sectionId)) {
      store.roleMenuAccess.userPortal.push(sectionId);
      changed = true;
    }
  }
  if (!store.consultants) {
    store.consultants = cloneStore(seedStore).consultants;
    changed = true;
  }

  for (const destination of store.destinations) {
    const normalizedHighlights = normalizeStringArray(destination.highlights);
    if (JSON.stringify(normalizedHighlights) !== JSON.stringify(destination.highlights)) {
      destination.highlights = normalizedHighlights;
      changed = true;
    }

    const normalizedUniversities = normalizeStringArray(destination.universities);
    if (JSON.stringify(normalizedUniversities) !== JSON.stringify(destination.universities)) {
      destination.universities = normalizedUniversities;
      changed = true;
    }

    const normalizedRequirements = normalizeStringArray(destination.requirements);
    if (JSON.stringify(normalizedRequirements) !== JSON.stringify(destination.requirements)) {
      destination.requirements = normalizedRequirements;
      changed = true;
    }

    const normalizedWorkOptions = normalizeStringArray(destination.workOptions);
    if (JSON.stringify(normalizedWorkOptions) !== JSON.stringify(destination.workOptions)) {
      destination.workOptions = normalizedWorkOptions;
      changed = true;
    }

    if (!destination.accent) {
      destination.accent = "from-blue-50 to-slate-50";
      changed = true;
    }
  }

  for (const inquiry of store.inquiries) {
    if (!inquiry.leadStage) {
      inquiry.leadStage = inquiry.status === "resolved" ? "enrolled" : inquiry.status === "contacted" ? "contacted" : "new";
      changed = true;
    }
    if ((inquiry.leadStage as string) === "converted") {
      inquiry.leadStage = "enrolled";
      changed = true;
    }
    if (inquiry.followUpAt === undefined) {
      inquiry.followUpAt = null;
      changed = true;
    }
    if (inquiry.assignedToUserId === undefined) {
      inquiry.assignedToUserId = null;
      changed = true;
    }
    if (inquiry.assignedToName === undefined) {
      inquiry.assignedToName = null;
      changed = true;
    }
    if (inquiry.leadScore === undefined) {
      inquiry.leadScore = calculateLeadScore(inquiry);
      changed = true;
    }
    if (inquiry.destination === undefined) {
      inquiry.destination = inferDestination(`${inquiry.subject} ${inquiry.message}`, store.destinations);
      changed = true;
    }
    if (inquiry.programLevel === undefined) {
      inquiry.programLevel = inferProgramLevel(`${inquiry.subject} ${inquiry.message}`);
      changed = true;
    }
    if (inquiry.intake === undefined) {
      inquiry.intake = inferIntake(`${inquiry.subject} ${inquiry.message}`);
      changed = true;
    }
    if (inquiry.lastContactedAt === undefined) {
      inquiry.lastContactedAt = inquiry.status === "contacted" ? inquiry.createdAt : null;
      changed = true;
    }
    const readinessScore = calculateVisaReadinessScore(inquiry, store.studentDocuments);
    if (inquiry.visaReadinessScore !== readinessScore) {
      inquiry.visaReadinessScore = readinessScore;
      changed = true;
    }
  }

  for (const program of store.programs) {
    if (program.tuitionFee === undefined) {
      program.tuitionFee = null;
      changed = true;
    }
    const normalizedIntakeMonths = normalizeStringArray(program.intakeMonths);
    if (JSON.stringify(normalizedIntakeMonths) !== JSON.stringify(program.intakeMonths)) {
      program.intakeMonths = normalizedIntakeMonths;
      changed = true;
    }
    if (program.eligibility === undefined) {
      program.eligibility = null;
      changed = true;
    }
    if (program.englishRequirement === undefined) {
      program.englishRequirement = null;
      changed = true;
    }
    if (program.applicationDeadline === undefined) {
      program.applicationDeadline = null;
      changed = true;
    }
    if (program.scholarshipAvailable === undefined) {
      program.scholarshipAvailable = false;
      changed = true;
    }
    const normalizedCareerOutcomes = normalizeStringArray(program.careerOutcomes);
    if (JSON.stringify(normalizedCareerOutcomes) !== JSON.stringify(program.careerOutcomes)) {
      program.careerOutcomes = normalizedCareerOutcomes;
      changed = true;
    }
  }

  for (const image of store.gallery) {
    if (image.name === undefined) {
      image.name = image.url.split("/").pop() || `image-${image.id}`;
      changed = true;
    }
    if (image.contentType === undefined) {
      image.contentType = null;
      changed = true;
    }
    if (image.sizeBytes === undefined) {
      image.sizeBytes = null;
      changed = true;
    }
    if (image.uploadedByUserId === undefined) {
      image.uploadedByUserId = null;
      changed = true;
    }
    if (image.uploadedByName === undefined) {
      image.uploadedByName = null;
      changed = true;
    }
    if (image.updatedAt === undefined) {
      image.updatedAt = null;
      changed = true;
    }
  }

  for (const appointment of store.appointments) {
    if (appointment.consultantId === undefined) {
      appointment.consultantId = null;
      changed = true;
    }
    if (appointment.consultantName === undefined) {
      appointment.consultantName = null;
      changed = true;
    }
    if (appointment.meetingType === undefined) {
      appointment.meetingType = "phone";
      changed = true;
    }
    if (appointment.assignedToUserId === undefined) {
      appointment.assignedToUserId = null;
      changed = true;
    }
    if (appointment.assignedToName === undefined) {
      appointment.assignedToName = null;
      changed = true;
    }
  }

  for (const user of store.users) {
    if (user.positionId === undefined) {
      user.positionId = null;
      changed = true;
    }
    if (user.positionName === undefined) {
      user.positionName = null;
      changed = true;
    }
    if (user.reportsToUserId === undefined) {
      user.reportsToUserId = null;
      changed = true;
    }
    if (user.reportsToName === undefined) {
      user.reportsToName = null;
      changed = true;
    }
  }

  for (const document of store.studentDocuments) {
    if (document.documentType === undefined) {
      document.documentType = null;
      changed = true;
    }
    if (document.checklistItemId === undefined) {
      document.checklistItemId = null;
      changed = true;
    }
    if (document.assignedToUserId === undefined) {
      document.assignedToUserId = null;
      changed = true;
    }
    if (document.assignedToName === undefined) {
      document.assignedToName = null;
      changed = true;
    }
  }

  for (const scholarship of store.scholarships) {
    if (!scholarship.programLevel) {
      scholarship.programLevel = "any";
      changed = true;
    }
    if (scholarship.intake === undefined) {
      scholarship.intake = null;
      changed = true;
    }
    if (scholarship.applicationLink === undefined) {
      scholarship.applicationLink = null;
      changed = true;
    }
    if (scholarship.active === undefined) {
      scholarship.active = true;
      changed = true;
    }
  }

  for (const template of store.documentChecklistTemplates) {
    if (!template.programLevel) {
      template.programLevel = "any";
      changed = true;
    }
    if (!Array.isArray(template.items)) {
      template.items = [];
      changed = true;
    }
    template.items = template.items.map((item, index) => ({
      id: item.id || `${template.destination.toLowerCase().replace(/\W+/g, "-")}-${index + 1}`,
      label: item.label || "Document",
      required: item.required !== false,
    }));
  }

  return changed;
}

function inferDestination(text: string, destinations: DestinationRecord[]): string | null {
  const normalized = text.toLowerCase();
  const found = destinations.find((destination) =>
    [destination.name, destination.slug, destination.code].some((value) => normalized.includes(String(value).toLowerCase())),
  );
  return found?.name || null;
}

function inferProgramLevel(text: string): ProgramLevel | null {
  const normalized = text.toLowerCase();
  if (/(phd|doctorate|research)/.test(normalized)) return "research";
  if (/(masters|master|mba|msc|ms|postgraduate)/.test(normalized)) return "postgraduate";
  if (/(bachelor|undergraduate|bsc|ba|bba)/.test(normalized)) return "undergraduate";
  if (/(diploma|certificate)/.test(normalized)) return "diploma";
  return null;
}

function inferIntake(text: string): string | null {
  const match = text.match(/\b(january|february|may|july|september|november|spring|summer|fall|autumn)\s*\d{0,4}/i);
  return match ? match[0].trim() : null;
}

export function calculateVisaReadinessScore(inquiry: Pick<InquiryRecord, "email" | "leadStage">, documents: StudentDocumentRecord[]): number {
  const stageWeights: Record<LeadStage, number> = {
    new: 10,
    contacted: 20,
    counseling: 35,
    documents: 50,
    applied: 65,
    offer: 78,
    visa: 88,
    enrolled: 100,
    lost: 0,
  };
  const studentDocuments = documents.filter((document) => document.userEmail.toLowerCase() === inquiry.email.toLowerCase());
  const approved = studentDocuments.filter((document) => document.status === "approved").length;
  const uploaded = studentDocuments.length;
  const documentScore = Math.min(35, approved * 10 + Math.max(0, uploaded - approved) * 4);
  return Math.min(100, Math.max(stageWeights[inquiry.leadStage || "new"], stageWeights[inquiry.leadStage || "new"] + documentScore));
}

function calculateLeadScore(input: {
  subject: string;
  message: string;
  phone?: string | null;
  whatsapp?: string | null;
  followUpAt?: string | null;
  leadStage?: LeadStage;
}): number {
  const text = `${input.subject} ${input.message}`.toLowerCase();
  let score = 20;
  if (input.phone) score += 15;
  if (input.whatsapp) score += 10;
  if (/(visa|urgent|asap|september|january|may|intake|funding|ielts|pte|budget)/.test(text)) score += 25;
  if (input.message.length > 120) score += 15;
  if (input.followUpAt && new Date(input.followUpAt).getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 7) score += 10;
  if (input.leadStage && ["counseling", "documents", "applied", "offer", "visa"].includes(input.leadStage)) score += 15;
  return Math.min(100, score);
}

async function readLocalStoreOrSeed(): Promise<AppStore> {
  try {
    const store = JSON.parse(await readFile(dataFile, "utf8")) as AppStore;
    normalizeStore(store);
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
      normalizeStore(migratedStore);
      await writeMongoStore(migratedStore);
      return migratedStore;
    }

    const { _id: _ignored, ...store } = document;
    const appStore = store as AppStore;
    if (normalizeStore(appStore)) {
      await writeMongoStore(appStore);
    }
    return appStore;
  }

  await ensureStore();
  const store = JSON.parse(await readFile(dataFile, "utf8")) as AppStore;
  if (normalizeStore(store)) {
    await writeLocalStore(store);
  }
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
