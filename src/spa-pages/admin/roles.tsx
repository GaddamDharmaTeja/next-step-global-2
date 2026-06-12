import { useState } from "react";
import { useQuery, useQueryClient, useQueryClient as useClient } from "@tanstack/react-query";
import {
  getListUsersQueryKey,
  useGetMyProfile,
  useListUsers,
  useUpdateUserRole,
} from "@workspace/api-client-react";
import { Crown, Network, ShieldCheck, Sparkles, UserRound, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  createAdminInvite,
  createUserPosition,
  getRoleMenuAccess,
  listAdminInvites,
  listUserPositions,
  updateRoleMenuAccess,
  updateUserProfile,
} from "@/lib/api";

const manageableMenus = [
  { id: "dashboard", label: "Dashboard" },
  { id: "content", label: "Site Content" },
  { id: "inquiries", label: "Inquiries" },
  { id: "pipeline", label: "Pipeline" },
  { id: "appointments", label: "Appointments" },
  { id: "consultants", label: "Consultants" },
  { id: "programs", label: "Programs" },
  { id: "countries", label: "Countries" },
  { id: "gallery", label: "Gallery" },
  { id: "testimonials", label: "Testimonials" },
  { id: "users", label: "Users" },
  { id: "notifications", label: "Notifications" },
  { id: "chats", label: "Chats" },
  { id: "templates", label: "Templates" },
  { id: "documents", label: "Documents" },
  { id: "scholarships", label: "Scholarships" },
  { id: "checklists", label: "Checklists" },
];

const userPortalSections = [
  { id: "hero", label: "Welcome Summary" },
  { id: "profile", label: "Personal Snapshot" },
  { id: "inquiries", label: "My Inquiries" },
  { id: "programs", label: "Recommended Programs" },
  { id: "documents", label: "Document Uploads" },
  { id: "appointments", label: "Consultation Booking" },
  { id: "scholarships", label: "Scholarship Finder" },
  { id: "messages", label: "Portal Messages" },
];

const roleMeta = {
  owner: {
    label: "Master / Owner",
    description: "Full platform access, can promote users, invite admins, and manage owners.",
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
    description: "Student portal access for personal inquiries, documents, and recommendations.",
    tone: "bg-slate-100 text-slate-800 border-slate-200",
    icon: UserRound,
  },
} as const;

export default function AdminRolesPage() {
  const { data: profile } = useGetMyProfile({
    query: { retry: false, refetchOnWindowFocus: false } as any,
  });
  const { data: users, isLoading } = useListUsers();
  const { data: invites = [] } = useQuery({
    queryKey: ["/api/admin-invites"],
    queryFn: listAdminInvites,
    enabled: profile?.role === "owner",
  });
  const { data: menuAccess } = useQuery({
    queryKey: ["/api/role-menu-access"],
    queryFn: getRoleMenuAccess,
    enabled: profile?.role === "owner",
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["/api/user-positions"],
    queryFn: listUserPositions,
    enabled: profile?.role === "owner",
  });
  const updateUserRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  const auxClient = useClient();
  const { toast } = useToast();
  const canManageRoles = profile?.role === "owner";
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner">("admin");
  const [positionName, setPositionName] = useState("");
  const [positionLevel, setPositionLevel] = useState("3");
  const [positionDescription, setPositionDescription] = useState("");
  const selectedAdminMenus = menuAccess?.admin || [];
  const selectedUserPortalSections = menuAccess?.userPortal || [];
  const safeUsers = users ?? [];
  const ownerCount = safeUsers.filter((user) => user.role === "owner").length;
  const adminCount = safeUsers.filter((user) => user.role === "admin").length;
  const memberCount = safeUsers.filter((user) => user.role === "user").length;
  const assignableUsers = safeUsers.filter((user) => user.role === "user");

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

  const handleCreatePosition = async () => {
    try {
      await createUserPosition({
        name: positionName,
        level: Number(positionLevel) || 3,
        description: positionDescription || null,
      });
      setPositionName("");
      setPositionLevel("3");
      setPositionDescription("");
      await auxClient.invalidateQueries({ queryKey: ["/api/user-positions"] });
      toast({ title: "User type created" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to create user type",
        variant: "destructive",
      });
    }
  };

  const handlePositionAssign = async (userId: string, positionId: string) => {
    try {
      await updateUserProfile(userId, { positionId: positionId === "none" ? "" : positionId });
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User type assigned" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to assign user type",
        variant: "destructive",
      });
    }
  };

  const handleAdminMenuToggle = async (menuId: string, checked: boolean) => {
    if (!canManageRoles) return;
    const nextMenus = checked
      ? Array.from(new Set([...selectedAdminMenus, menuId]))
      : selectedAdminMenus.filter((item) => item !== menuId);

    try {
      await updateRoleMenuAccess({ admin: nextMenus, userPortal: selectedUserPortalSections });
      await auxClient.invalidateQueries({ queryKey: ["/api/role-menu-access"] });
      toast({ title: "Admin menu access updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update menu access", variant: "destructive" });
    }
  };

  const handleUserPortalToggle = async (sectionId: string, checked: boolean) => {
    if (!canManageRoles) return;
    const nextSections = checked
      ? Array.from(new Set([...selectedUserPortalSections, sectionId]))
      : selectedUserPortalSections.filter((item) => item !== sectionId);

    try {
      await updateRoleMenuAccess({ admin: selectedAdminMenus, userPortal: nextSections });
      await auxClient.invalidateQueries({ queryKey: ["/api/role-menu-access"] });
      toast({ title: "User portal visibility updated" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to update user portal visibility", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.97)_0%,rgba(30,58,95,0.94)_55%,rgba(14,116,144,0.86)_100%)] px-6 py-7 text-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] sm:px-8">
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100/90">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Owner role studio
              </div>
              <h2 className="mt-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Manage permissions and master access.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Role changes are owner-only, with safeguards so the last owner cannot be removed.
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
                <div className="text-sm text-slate-300">Users</div>
                <div className="mt-3 text-3xl font-semibold">{memberCount}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Permission Layers</CardTitle>
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
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Create Role Invite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite email" className="h-12 rounded-xl" />
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "admin" | "owner")}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin Invite</SelectItem>
                    <SelectItem value="owner">Owner Invite</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} className="h-12 w-full rounded-xl bg-[#e4aa19] font-semibold text-black hover:bg-[#d89e12]">
                  Create Invite
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Owner Required</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-sm leading-7 text-slate-600">Only owners can change roles or create admin/owner invites.</CardContent>
            </Card>
          )}
        </div>

        {canManageRoles && invites.length > 0 && (
          <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200/70 pb-5">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Pending Role Invites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {invites.map((invite) => (
                <div key={invite.id} className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{invite.email}</div>
                    <div className="mt-1 text-sm text-slate-500">Created {new Date(invite.createdAt).toLocaleString()}</div>
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

        {canManageRoles && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Admin Menu Visibility</CardTitle>
                <p className="mt-2 text-sm text-slate-600">Choose which admin portal menus are visible for admin users. Owners always see everything.</p>
              </CardHeader>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
                {manageableMenus.map((menu) => (
                  <label key={menu.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800">
                    <Checkbox checked={selectedAdminMenus.includes(menu.id)} onCheckedChange={(checked) => handleAdminMenuToggle(menu.id, checked === true)} />
                    {menu.label}
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">User Portal Content Visibility</CardTitle>
                <p className="mt-2 text-sm text-slate-600">Choose which student portal sections normal users can see.</p>
              </CardHeader>
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
                {userPortalSections.map((section) => (
                  <label key={section.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800">
                    <Checkbox checked={selectedUserPortalSections.includes(section.id)} onCheckedChange={(checked) => handleUserPortalToggle(section.id, checked === true)} />
                    {section.label}
                  </label>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {canManageRoles && (
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
                  <Network className="h-5 w-5" /> Create User Type / Position
                </CardTitle>
                <p className="mt-2 text-sm text-slate-600">Owner-created positions can be assigned only to normal users, never admins or owners.</p>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <Input value={positionName} onChange={(event) => setPositionName(event.target.value)} placeholder="Position name, e.g. Junior Counselor" className="h-12 rounded-xl" />
                <Input value={positionLevel} onChange={(event) => setPositionLevel(event.target.value)} type="number" min="1" placeholder="Level" className="h-12 rounded-xl" />
                <Input value={positionDescription} onChange={(event) => setPositionDescription(event.target.value)} placeholder="Short description" className="h-12 rounded-xl" />
                <Button onClick={handleCreatePosition} className="h-12 w-full rounded-xl bg-[#101b31] font-semibold text-white hover:bg-[#172846]">
                  Create User Type
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-200/70 pb-5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Assign User Types</CardTitle>
                <p className="mt-2 text-sm text-slate-600">Only regular users are listed here. Admin and owner accounts are intentionally excluded.</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {assignableUsers.length === 0 && <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">No normal users available for assignment.</div>}
                {assignableUsers.map((user) => (
                  <div key={user.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px] md:items-center">
                    <div>
                      <div className="font-medium text-slate-900">{user.name || "Unnamed user"}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                    <Select value={(user as any).positionId || "none"} onValueChange={(value) => handlePositionAssign(user.id, value)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="User type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No user type</SelectItem>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>{position.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-200/70 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Assign Roles</CardTitle>
                <p className="mt-2 text-sm text-slate-600">Change a user between user, admin, and owner.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><UsersRound className="h-5 w-5" /></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleMeta[user.role]?.tone || roleMeta.user.tone}>{roleMeta[user.role]?.label || user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={user.role} disabled={!canManageRoles || profile?.id === user.id} onValueChange={(val) => handleRoleChange(user.id, val)}>
                        <SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
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
