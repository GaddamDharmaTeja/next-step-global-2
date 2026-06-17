import { useMemo, useState } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, MessageSquarePlus, Search, Send, Trash2, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createChatConversation,
  deleteChatConversation,
  listChatConversations,
  listChatUsers,
  sendChatMessage,
  type ChatConversationRecord,
  type ChatUserRecord,
} from "@/lib/api";

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value?: string | null) {
  if (!value) return "Today";
  return new Date(value).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function initials(value: string) {
  return value.trim().slice(0, 1).toUpperCase() || "N";
}

function directTitle(conversation: ChatConversationRecord, currentUserId: string) {
  if (conversation.type === "group") return conversation.title;
  const other = conversation.members.find((member) => member.id !== currentUserId);
  return other?.name || other?.email || conversation.title;
}

function lastPreview(conversation: ChatConversationRecord) {
  return conversation.lastMessage?.body || (conversation.type === "group" ? `${conversation.members.length} members` : "Start a conversation");
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "manager") return "Manager";
  if (role === "admin") return "Admin";
  return "Student";
}

export default function AdminChatsPage() {
  const { data: profile } = useGetMyProfile({ query: { retry: false, refetchOnWindowFocus: false } as any });
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/chat/conversations"],
    queryFn: listChatConversations,
    refetchInterval: 3000,
  });
  const { data: users = [] } = useQuery({ queryKey: ["/api/chat/users"], queryFn: listChatUsers });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);

  const filteredConversations = conversations.filter((conversation) => {
    const needle = search.trim().toLowerCase();
    if (!needle || !profile) return true;
    return [
      directTitle(conversation, profile.id),
      conversation.title,
      ...conversation.members.map((member) => `${member.name || ""} ${member.email}`),
      ...conversation.messages.map((message) => message.body),
    ].some((value) => value.toLowerCase().includes(needle));
  });

  const filteredUsers = users.filter((user) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${user.name || ""} ${user.email} ${user.role}`.toLowerCase().includes(needle);
  });

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || filteredConversations[0] || null;
  const visibleMessages = useMemo(() => selectedConversation?.messages || [], [selectedConversation]);

  const refreshChats = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
  };

  const startDirectChat = async (user: ChatUserRecord) => {
    try {
      const conversation = await createChatConversation({ type: "direct", memberUserIds: [user.id] });
      setSelectedConversationId(conversation.id);
      setComposeOpen(false);
      await refreshChats();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to start chat", variant: "destructive" });
    }
  };

  const createGroup = async () => {
    if (selectedGroupMembers.length === 0) {
      toast({ title: "Select group members", variant: "destructive" });
      return;
    }
    try {
      const conversation = await createChatConversation({ type: "group", title: groupName || "New Group", memberUserIds: selectedGroupMembers });
      setSelectedConversationId(conversation.id);
      setGroupName("");
      setSelectedGroupMembers([]);
      setComposeOpen(false);
      await refreshChats();
      toast({ title: "Group created" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to create group", variant: "destructive" });
    }
  };

  const sendReply = async () => {
    if (!replyBody.trim() || !selectedConversation) return;
    try {
      await sendChatMessage(selectedConversation.id, replyBody);
      setReplyBody("");
      await refreshChats();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to send message", variant: "destructive" });
    }
  };

  const deleteSelectedChat = async () => {
    if (!selectedConversation) return;
    if (!confirm(`Delete chat "${selectedConversation.title}" and all messages?`)) return;
    try {
      await deleteChatConversation(selectedConversation.id);
      setSelectedConversationId("");
      await refreshChats();
      toast({ title: "Chat deleted" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to delete chat", variant: "destructive" });
    }
  };

  const toggleGroupMember = (userId: string, checked: boolean) => {
    setSelectedGroupMembers((current) => (checked ? Array.from(new Set([...current, userId])) : current.filter((id) => id !== userId)));
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a77400]">Messages</div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Chat Desk</h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Chats are separate from inquiries
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="grid gap-4 border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef5ff)] p-4 xl:grid-cols-[auto_minmax(320px,1fr)_auto] xl:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#17458d,#13b981)] text-white shadow-[0_16px_36px_rgba(23,69,141,0.18)]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">Chats</h3>
                <p className="mt-1 text-sm text-slate-500">{filteredConversations.length} conversations</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats, users, groups..." className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 text-base shadow-none focus-visible:ring-[#17458d]" />
            </div>
            <Button onClick={() => setComposeOpen((current) => !current)} className="h-12 rounded-xl bg-[#0f9f7f] px-5 text-white hover:bg-[#087a63]">
              <MessageSquarePlus className="mr-2 h-5 w-5" />
              New chat
            </Button>
          </div>

          {composeOpen && (
            <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              {profile?.role === "owner" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="font-semibold text-slate-950">Create Group</div>
                  <Input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="mt-3 h-11" />
                  <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {users.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-600">No login users available. Create user accounts first.</div>}
                    {users.map((user) => (
                      <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                        <Checkbox checked={selectedGroupMembers.includes(user.id)} onCheckedChange={(checked) => toggleGroupMember(user.id, checked === true)} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-950">{user.name || user.email}</span>
                          <span className="block truncate text-xs text-slate-500">{user.email}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button className="mt-3 w-full bg-[#0f9f7f] text-white hover:bg-[#087a63]" onClick={createGroup}>Create Group</Button>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-950">Start Direct Chat</div>
                <div className="mt-3 max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-600">No users available to message.</div>}
                  {filteredUsers.map((user) => (
                    <button key={user.id} type="button" onClick={() => startDirectChat(user)} className="flex w-full gap-3 rounded-lg p-2 text-left transition hover:bg-slate-50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f7ef] text-sm font-bold text-[#087a63]">{initials(user.name || user.email)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-slate-950">{user.name || user.email}</div>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{roleLabel(user.role)}</span>
                        </div>
                        <div className="truncate text-xs text-slate-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid h-[calc(100vh-300px)] min-h-[520px] lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white">
              {conversationsLoading && <div className="p-4 text-sm text-slate-600">Loading chats...</div>}
              {!conversationsLoading && filteredConversations.length === 0 && (
                <div className="m-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">No chats yet. Start a direct chat or create a group.</div>
              )}
              {filteredConversations.map((conversation) => {
                const title = profile ? directTitle(conversation, profile.id) : conversation.title;
                const isSelected = selectedConversation?.id === conversation.id;
                return (
                  <button key={conversation.id} type="button" onClick={() => setSelectedConversationId(conversation.id)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition ${isSelected ? "bg-[#eef5ff]" : "bg-white hover:bg-slate-50"}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dff7e9] text-base font-bold text-[#087a63]">
                      {conversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="truncate font-semibold text-slate-950">{title}</div>
                        <div className="shrink-0 text-xs text-slate-500">{formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</div>
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-500">{lastPreview(conversation)}</div>
                    </div>
                  </button>
                );
              })}
            </aside>

            <section className="flex min-h-0 flex-col bg-[#f2eee7]">
              {selectedConversation && profile ? (
                <>
                  <div className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dff7e9] text-base font-bold text-[#087a63]">
                        {selectedConversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(directTitle(selectedConversation, profile.id))}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-slate-950">{directTitle(selectedConversation, profile.id)}</h3>
                        <p className="truncate text-sm text-slate-500">{selectedConversation.type === "group" ? `${selectedConversation.members.length} members` : "Direct chat"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.role === "owner" && <Button variant="ghost" size="icon" className="rounded-full text-slate-500" onClick={deleteSelectedChat} aria-label="Delete chat"><Trash2 className="h-5 w-5" /></Button>}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.75)_0_1px,transparent_1px)] bg-[length:28px_28px] p-5">
                    <div className="mx-auto w-fit rounded-full bg-white/80 px-4 py-1 text-xs font-semibold text-slate-500 shadow-sm">{formatDate(selectedConversation.updatedAt)}</div>
                    {visibleMessages.length === 0 && <div className="mx-auto mt-8 max-w-md rounded-xl bg-white/90 p-4 text-center text-sm leading-6 text-slate-600 shadow-sm">No messages yet. Send the first message in this chat.</div>}
                    {visibleMessages.map((message) => {
                      const fromMe = message.senderUserId === profile.id;
                      return (
                        <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[76%] rounded-xl px-4 py-3 shadow-sm ${fromMe ? "bg-[#dff7d7] text-slate-950" : "bg-white text-slate-950"}`}>
                            {selectedConversation.type === "group" && !fromMe && <div className="mb-1 text-xs font-semibold text-[#087a63]">{message.senderName}</div>}
                            <p className="whitespace-pre-wrap text-[15px] leading-6">{message.body}</p>
                            <div className="mt-1 text-right text-[11px] text-slate-500">{formatTime(message.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 bg-white p-4">
                    <div className="flex items-end gap-3">
                      <Textarea rows={1} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Type a message..." className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 shadow-none focus-visible:ring-[#17458d]" />
                      <Button onClick={sendReply} disabled={!replyBody.trim()} size="icon" className="h-12 w-12 shrink-0 rounded-full bg-[#0f9f7f] text-white hover:bg-[#087a63]" aria-label="Send reply"><Send className="h-5 w-5" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-600">Select a chat or start a new conversation.</div>
              )}
            </section>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
