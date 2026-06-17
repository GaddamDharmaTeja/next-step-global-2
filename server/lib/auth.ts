import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import type { UserRecord, UserRole } from "./store";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "nextstep_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

export interface PublicUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRecord["role"];
  positionId?: string | null;
  positionName?: string | null;
  reportsToUserId?: string | null;
  reportsToName?: string | null;
  createdAt: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: UserRecord | null;
    }
  }
}

export function getCookieSecret(): string {
  return process.env.COOKIE_SECRET || "nextstep-local-cookie-secret";
}

function getSessionCookieOptions() {
  const crossSite = process.env.COOKIE_CROSS_SITE === "true";
  return {
    httpOnly: true,
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    signed: true,
    secure: crossSite || process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    positionId: user.positionId ?? null,
    positionName: user.positionName ?? null,
    reportsToUserId: user.reportsToUserId ?? null,
    reportsToName: user.reportsToName ?? null,
    createdAt: user.createdAt,
  };
}

export function createUserId(): string {
  return randomBytes(12).toString("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash?: string | null): Promise<boolean> {
  if (!passwordHash) {
    return false;
  }

  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hash, "hex");

  if (stored.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(stored, derivedKey);
}

export function setSessionCookie(res: Response, user: UserRecord): void {
  res.cookie(SESSION_COOKIE, user.id, getSessionCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  const options = getSessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: options.httpOnly,
    sameSite: options.sameSite,
    signed: options.signed,
    secure: options.secure,
    path: options.path,
    domain: options.domain,
  });
}

export async function attachAuthUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const userId = req.signedCookies?.[SESSION_COOKIE];
  if (!userId || typeof userId !== "string") {
    req.authUser = null;
    next();
    return;
  }

  const { readStore } = await import("./store");
  const store = await readStore();
  req.authUser = store.users.find((entry) => entry.id === userId) ?? null;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!hasRequiredRole(req.authUser.role, ["admin", "manager", "owner"])) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!hasRequiredRole(req.authUser.role, ["owner"])) {
    res.status(403).json({ error: "Owner access required" });
    return;
  }
  next();
}
