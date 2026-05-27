import { useQueryClient } from "@tanstack/react-query";
import { getListUsersQueryKey, useGetMyProfile, useListUsers } from "@workspace/api-client-react";
import { Trash2, UserRound, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { deleteUser } from "@/lib/api";

const roleTone = {
  owner: "bg-amber-100 text-amber-900 border-amber-200",
  admin: "bg-sky-100 text-sky-900 border-sky-200",
  user: "bg-slate-100 text-slate-800 border-slate-200",
} as const;

export default function AdminUsersPage() {
  const { data: profile } = useGetMyProfile({
    query: { retry: false, refetchOnWindowFocus: false } as any,
  });
  const { data: users, isLoading } = useListUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const safeUsers = users ?? [];
  const canDeleteUsers = profile?.role === "owner";

  const handleDelete = async (userId: string, email: string) => {
    if (!canDeleteUsers) {
      toast({ title: "Only owners can delete users", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete user ${email}?`)) return;

    try {
      await deleteUser(userId);
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User deleted" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to delete user", variant: "destructive" });
    }
  };

  if (isLoading) return <AdminLayout><div className="p-8">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                <UsersRound className="h-3.5 w-3.5" />
                People Directory
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Users</h2>
              <p className="mt-2 text-slate-600">View accounts and remove users when needed. Role changes are handled from the Roles menu.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-700">
              <UserRound className="h-7 w-7" />
            </div>
          </div>
        </section>

        <Card className="rounded-[1.75rem] border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-slate-200/70 pb-5">
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Joined</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeUsers.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center">No users found.</TableCell></TableRow>
                )}
                {safeUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge className={roleTone[user.role] || roleTone.user}>{user.role}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={!canDeleteUsers || profile?.id === user.id}
                        onClick={() => handleDelete(user.id, user.email)}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
