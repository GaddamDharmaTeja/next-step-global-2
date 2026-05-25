import { useState } from "react";
import { useQuery, useQueryClient, useQueryClient as useClient } from "@tanstack/react-query";
import {
  getListUsersQueryKey,
  useGetMyProfile,
  useListUsers,
  useUpdateUserRole,
} from "@workspace/api-client-react";
import { Crown, ShieldCheck, Sparkles, UserRound, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createAdminInvite, listAdminInvites } from "@/lib/api";

const roleMeta = {
  owner: {
    label: "Master / Owner",
    description:
      "Full platform access, can promote users, invite admins, and manage owners.",
    tone: "bg-amber-100 text-amber-900 border-amber-200",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    description: "Operational access to manage student-facing data and workflows.",
    tone: "bg-sky-100 text-sky-900 border-sky-200",
    icon: ShieldCheck,
  },
  user: {
    label: "User",
    description:
      "Student portal access for personal inquiries, documents, and recommendations.",
    tone: "bg-slate-100 text-slate-800 border-slate-200",
    icon: UserRound,
  },
} as const;

export default function AdminUsersPage() {
  const { data: profile } = useGetMyProfile({
    query: { retry: false, refetchOnWindowFocus: false } as any,
  });
  const { data: users, isLoading } = useListUsers();
  const { data: invites = [] } = useQuery({
    queryKey: ["/api/admin-invites"],
    queryFn: listAdminInvites,
    enabled: profile?.role === "owner",
  });
  const updateUserRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  const auxClient = useClient();
  const { toast } = useToast();
  const canManageRoles = profile?.role === "owner";
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner">("admin");
  const safeUsers = users ?? [];
  const ownerCount = safeUsers.filter((user) => user.role === "owner").length;
  const adminCount = safeUsers.filter((user) => user.role === "admin").length;
  const memberCount = safeUsers.filter((user) => user.role === "user").length;

  const handleRoleChange = (userId: string, role: string) => {
    if (!canManageRoles) {
      toast({ title: "Only the owner can change user roles", variant: "destructive" });
      return;
    }

    updateUserRole.mutate(
      { userId, data: { role: role as "user" | "admin" | "owner" } },
      {
        onSuccess: () => {
          toast({ title: "User role updated" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: () => {
          toast({ title: "Error updating role", variant: "destructive" });
        },
      },
    );
  };

  const handleInvite = async () => {
    try {
      await createAdminInvite({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      await auxClient.invalidateQueries({ queryKey: ["/api/admin-invites"] });
      toast({ title: "Invite saved. Matching signup will receive that role." });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to create invite",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.97)_0%,rgba(30,58,95,0.94)_55%,rgba(14,116,144,0.86)_100%)] px-6 py-7 text-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] sm:px-8">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100/90">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Role studio and team access
              </div>
              <h2 className="mt-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Manage people, permissions, and master access.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Control who can operate the platform, who can counsel students, and who has top-level ownership over the system.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
              <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Owners</div>
                <div className="mt-3 text-3xl font-semibold">{ownerCount}</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Admins</div>
                <div className="mt-3 text-3xl font-semibold">{adminCount}</div>
              </div>
              <div className="rounded-[1.35rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm text-slate-300">Members</div>
                <div className="mt-3 text-3xl font-semibold">{memberCount}</div>
              </div>
            </div>
          </div>
        </section>

        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">Role Control</h3>
          <p className="mt-2 text-slate-600">
            Existing roles remain `user`, `admin`, and `owner`. The owner role acts as master access for the whole platform.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Permission Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
              {(["owner", "admin", "user"] as const).map((role) => {
                const meta = roleMeta[role];
                const Icon = meta.icon;
                return (
                  <div key={role} className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/80 p-5">
                    <div className={`inline-flex rounded-2xl p-3 ${meta.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-slate-900">{meta.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{meta.description}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {canManageRoles ? (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  Create Role Invite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite email"
                  className="h-12 rounded-xl"
                />
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "admin" | "owner")}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin Invite</SelectItem>
                    <SelectItem value="owner">Owner Invite</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleInvite}
                  className="h-12 w-full rounded-xl bg-[#e4aa19] font-semibold text-black hover:bg-[#d89e12]"
                >
                  Create Invite
                </Button>
                <p className="text-sm leading-6 text-slate-500">
                  When that email signs up, the saved invite automatically assigns the selected role.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  Master Access Required
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-sm leading-7 text-slate-600">
                Only the owner can create admin or owner invites and change system-wide roles.
              </CardContent>
            </Card>
          )}
        </div>

        {canManageRoles && invites.length > 0 && (
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Pending Role Invites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-900">{invite.email}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Created {new Date(invite.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={roleMeta[invite.role as keyof typeof roleMeta]?.tone || roleMeta.admin.tone}>
                      {roleMeta[invite.role as keyof typeof roleMeta]?.label || invite.role}
                    </Badge>
                    <span className="text-sm font-medium capitalize text-slate-500">{invite.status}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-200/70 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  People Directory
                </CardTitle>
                <p className="mt-2 text-sm text-slate-600">
                  View every member and assign access based on responsibility.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <UsersRound className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Joined</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
                {safeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge className={roleMeta[user.role]?.tone || roleMeta.user.tone}>
                          {roleMeta[user.role]?.label || user.role}
                        </Badge>
                        <Select
                          value={user.role}
                          disabled={!canManageRoles || profile?.id === user.id}
                          onValueChange={(val) => handleRoleChange(user.id, val)}
                        >
                          <SelectTrigger className="w-[150px] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
