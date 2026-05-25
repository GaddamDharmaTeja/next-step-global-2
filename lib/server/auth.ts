import { auth } from "@clerk/nextjs/server";
import type { UserRecord, UserRole } from "./store";

export interface PublicUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRecord["role"];
  createdAt: string;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get the current authenticated user from Clerk
 */
export async function getCurrentUser(): Promise<{ userId: string; user: any } | null> {
  try {
    const { userId, user: clerkUser } = await auth();
    if (!userId || !clerkUser) {
      return null;
    }
    return { userId, user: clerkUser };
  } catch {
    return null;
  }
}

/**
 * Assert that the user is authenticated
 * Throws if no user is found
 */
export async function assertAuth() {
  const current = await getCurrentUser();
  if (!current) {
    throw new Error("Authentication required");
  }
  return current;
}

/**
 * Assert that the user has admin or owner role
 */
export function assertAdminRole(userRole: UserRole): void {
  if (!hasRequiredRole(userRole, ["admin", "owner"])) {
    throw new Error("Admin access required");
  }
}

/**
 * Assert that the user has owner role
 */
export function assertOwnerRole(userRole: UserRole): void {
  if (!hasRequiredRole(userRole, ["owner"])) {
    throw new Error("Owner access required");
  }
}

export function createUserId(): string {
  return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
}
