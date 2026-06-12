import { useMemo, useState } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Paperclip, Search, Send, Smile, Trash2, UsersRound } from "lucide-react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createChatConversation,
  deleteChatConversation,
  listConsultants,
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

export default function AdminChatsPage() {
  const { data: profile } = useGetMyProfile({ query: { retry: false, refetchOnWindowFocus: false } as any });
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/chat/conversations"],
    queryFn: listChatConversations,
    refetchInterval: 3000,
  });
  const { data: users = [] } = useQuery({ queryKey: ["/api/chat/users"], queryFn: listChatUsers });
  const { data: consultants = [] } = useQuery({ queryKey: ["/api/consultants"], queryFn: listConsultants });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

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

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || filteredConversations[0] || null;
  const visibleMessages = useMemo(() => selectedConversation?.messages || [], [selectedConversation]);

  const refreshChats = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
  };

  const startDirectChat = async (user: ChatUserRecord) => {
    try {
      const conversation = await createChatConversation({ type: "direct", memberUserIds: [user.id] });
      setSelectedConversationId(conversation.id);
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
        <section className="rounded-[1.25rem] bg-[#075e54] px-6 py-5 text-white">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">Student Chats</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Direct and group messaging</h2>
          <p className="mt-2 max-w-2xl text-emerald-50">Chats are separate from inquiries. Messages are stored in the database and can be cleaned by the owner.</p>
        </section>

        <div className="grid h-[calc(100vh-220px)] min-h-[760px] overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm xl:grid-cols-[390px_minmax(0,1fr)_320px]">
          <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-[#f0f2f5] p-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <Input className="h-11 rounded-full border-0 bg-white pl-11 shadow-none focus-visible:ring-1 focus-visible:ring-[#25d366]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats, users, groups..." />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversationsLoading && <div className="p-4 text-sm text-slate-600">Loading chats...</div>}
              {filteredConversations.map((conversation) => {
                const title = profile ? directTitle(conversation, profile.id) : conversation.title;
                const isSelected = selectedConversation?.id === conversation.id;
                return (
                  <button key={conversation.id} type="button" onClick={() => setSelectedConversationId(conversation.id)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isSelected ? "bg-[#f0f2f5]" : "bg-white hover:bg-slate-50"}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-lg font-semibold text-[#008069]">
                      {conversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(title)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="truncate font-semibold text-slate-950">{title}</div>
                        <div className="shrink-0 text-xs text-slate-500">{formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</div>
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-600">{lastPreview(conversation)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col bg-[#efeae2]">
            {selectedConversation && profile ? (
              <>
                <div className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-lg font-semibold text-[#008069]">
                      {selectedConversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(directTitle(selectedConversation, profile.id))}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-slate-950">{directTitle(selectedConversation, profile.id)}</h3>
                      <p className="truncate text-sm text-slate-500">{selectedConversation.type === "group" ? `${selectedConversation.members.length} members` : "Direct chat"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.role === "owner" && (
                      <Button variant="ghost" size="icon" className="rounded-full text-[#54656f]" onClick={deleteSelectedChat} aria-label="Delete chat">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                    <MessageCircle className="h-6 w-6 text-[#54656f]" />
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0_1px,transparent_1px)] bg-[length:28px_28px] p-5">
                  {visibleMessages.length === 0 && <div className="mx-auto mt-8 max-w-md rounded-lg bg-white/80 p-4 text-center text-sm leading-6 text-slate-600 shadow-sm">No messages yet. Send the first message in this chat.</div>}
                  {visibleMessages.map((message) => {
                    const fromMe = message.senderUserId === profile.id;
                    return (
                      <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[76%] rounded-lg px-3 py-2 shadow-sm ${fromMe ? "bg-[#d9fdd3] text-slate-950" : "bg-white text-slate-950"}`}>
                          {selectedConversation.type === "group" && !fromMe && <div className="text-xs font-semibold text-[#008069]">{message.senderName}</div>}
                          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">{message.body}</p>
                          <div className="mt-1 flex justify-end text-[11px] text-slate-500">{formatTime(message.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 bg-[#f0f2f5] p-4">
                  <div className="flex items-end gap-3">
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-full text-[#54656f]" aria-label="Attach file">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-full text-[#54656f]" aria-label="Add emoji">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Textarea rows={1} value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Type a message" className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-3 shadow-none focus-visible:ring-1 focus-visible:ring-[#25d366]" />
                    <Button onClick={sendReply} disabled={!replyBody.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008069]" aria-label="Send reply">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-600">Select a chat or start a direct chat from the right.</div>
            )}
          </section>

          <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
            {profile?.role === "owner" && (
              <div className="mb-5 rounded-xl border border-slate-200 p-4">
                <div className="font-semibold text-slate-950">Create Group</div>
                <Input className="mt-3" value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" />
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                  {users.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      No login users available. Create user accounts for consultants or staff first, then select them here.
                    </div>
                  )}
                  {users.map((user) => (
                    <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-slate-50">
                      <Checkbox checked={selectedGroupMembers.includes(user.id)} onCheckedChange={(checked) => toggleGroupMember(user.id, checked === true)} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{user.name || user.email}</span>
                        <span className="block truncate text-xs text-slate-500">{user.email}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Button className="mt-3 w-full bg-[#00a884] hover:bg-[#008069]" onClick={createGroup}>Create Group</Button>
              </div>
            )}

            <div className="rounded-xl border border-slate-200">
              <div className="border-b border-slate-200 p-4 font-semibold text-slate-950">Start Direct Chat</div>
              <div className="max-h-[520px] overflow-y-auto">
                {users.length === 0 && (
                  <div className="p-4 text-sm leading-6 text-slate-600">
                    No other login users found. Add student, staff, or consultant logins from Users to message them here.
                  </div>
                )}
                {users.map((user) => (
                  <button key={user.id} type="button" onClick={() => startDirectChat(user)} className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{initials(user.name || user.email)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-950">{user.name || user.email}</div>
                      <div className="truncate text-xs text-slate-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {consultants.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60">
                <div className="border-b border-amber-200 p-4 font-semibold text-slate-950">Consultants</div>
                <div className="max-h-[360px] overflow-y-auto">
                  {consultants.map((consultant) => (
                    <div key={consultant.id} className="flex gap-3 border-b border-amber-100 px-4 py-3 last:border-b-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-amber-700">{initials(consultant.name)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-950">{consultant.name}</div>
                        <div className="truncate text-xs text-slate-500">{consultant.role}</div>
                        <div className="mt-1 text-xs leading-5 text-amber-700">Needs a login user account before they can receive chat.</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
