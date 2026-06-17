import { useState } from "react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { ArrowLeft, MessageCircle, Search, Send, UsersRound } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createChatConversation,
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

function roleLabel(role: string) {
  if (role === "manager") return "Manager";
  if (role === "admin") return "Admin";
  return "Student";
}

function isAdminOrManager(role: string) {
  return role === "admin" || role === "manager";
}

function isVisibleUserConversation(conversation: ChatConversationRecord, currentUserId: string) {
  const otherMembers = conversation.members.filter((member) => member.id !== currentUserId);
  return otherMembers.length > 0 && otherMembers.every((member) => isAdminOrManager(member.role));
}

export default function UserChatPage() {
  const { data: profile, isLoading } = useGetMyProfile({
    query: { retry: false, refetchOnWindowFocus: false } as any,
  });
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/chat/conversations"],
    queryFn: listChatConversations,
    enabled: Boolean(profile),
    refetchInterval: 3000,
  });
  const { data: users = [] } = useQuery({ queryKey: ["/api/chat/users"], queryFn: listChatUsers, enabled: Boolean(profile) });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageBody, setMessageBody] = useState("");

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;
  }

  if (!profile) {
    return <Redirect to="/sign-in" />;
  }

  if (profile.role === "admin" || profile.role === "manager" || profile.role === "owner") {
    return <Redirect to="/admin/chats" />;
  }

  const allowedConversations = conversations.filter((conversation) => isVisibleUserConversation(conversation, profile.id));

  const filteredConversations = allowedConversations.filter((conversation) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [
      directTitle(conversation, profile.id),
      conversation.title,
      ...conversation.members.map((member) => `${member.name || ""} ${member.email}`),
      ...conversation.messages.map((message) => message.body),
    ].some((value) => value.toLowerCase().includes(needle));
  });

  const filteredUsers = users.filter((user) => {
    if (!isAdminOrManager(user.role)) return false;
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${user.name || ""} ${user.email} ${user.role}`.toLowerCase().includes(needle);
  });

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) || filteredConversations[0] || null;
  const visibleMessages = selectedConversation?.messages || [];

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

  const sendMessage = async () => {
    if (!messageBody.trim() || !selectedConversation) return;
    try {
      await sendChatMessage(selectedConversation.id, messageBody);
      setMessageBody("");
      await refreshChats();
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to send message", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#e7e1d8] text-slate-950">
      <main className="mx-auto grid h-screen max-w-[1500px] overflow-hidden bg-white shadow-2xl lg:grid-cols-[410px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-5">
            <div className="flex items-center gap-3">
              <BrandLogo frameClassName="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm" imageClassName="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-semibold text-slate-950">Chats</h1>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
            </div>
            <Link href="/user-portal">
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to portal">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="border-b border-slate-100 bg-white px-4 py-3">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <Input className="h-11 rounded-full border-0 bg-[#f0f2f5] pl-11 shadow-none focus-visible:ring-1 focus-visible:ring-[#25d366]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search or start a new chat" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversationsLoading && <div className="p-4 text-sm text-slate-600">Loading chats...</div>}
            {filteredConversations.map((conversation) => {
              const title = directTitle(conversation, profile.id);
              const isSelected = selectedConversation?.id === conversation.id;
              return (
                <button key={conversation.id} type="button" onClick={() => setSelectedConversationId(conversation.id)} className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${isSelected ? "bg-[#f0f2f5]" : "bg-white hover:bg-slate-50"}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-lg font-semibold text-[#008069]">
                    {conversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="truncate text-[15px] font-semibold text-slate-950">{title}</div>
                      <div className="shrink-0 text-xs text-slate-500">{formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</div>
                    </div>
                    <div className="mt-1 truncate text-sm text-slate-500">{lastPreview(conversation)}</div>
                  </div>
                </button>
              );
            })}

            <div className="px-4 pb-3 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin Team</div>
            {filteredUsers.length === 0 && (
              <div className="mx-4 mb-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                No admin team members are available to message yet. Ask the owner to create an admin or manager login.
              </div>
            )}
            {filteredUsers.map((user) => (
              <button key={user.id} type="button" onClick={() => startDirectChat(user)} className="flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-600">{initials(user.name || user.email)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[15px] font-semibold text-slate-950">{user.name || user.email}</div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{roleLabel(user.role)}</span>
                  </div>
                  <div className="truncate text-sm text-slate-500">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[#efeae2]">
          {selectedConversation ? (
            <>
              <div className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-[#f0f2f5] px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9fdd3] text-lg font-semibold text-[#008069]">
                    {selectedConversation.type === "group" ? <UsersRound className="h-5 w-5" /> : initials(directTitle(selectedConversation, profile.id))}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">{directTitle(selectedConversation, profile.id)}</h2>
                    <p className="truncate text-sm text-slate-500">{selectedConversation.type === "group" ? `${selectedConversation.members.length} members` : "Direct chat"}</p>
                  </div>
                </div>
                <MessageCircle className="h-6 w-6 text-[#54656f]" />
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0_1px,transparent_1px)] bg-[length:28px_28px] p-5">
                {visibleMessages.length === 0 && <div className="mx-auto mt-8 max-w-md rounded-lg bg-white/80 p-4 text-center text-sm leading-6 text-slate-600 shadow-sm">No messages yet. Send the first message in this chat.</div>}
                {visibleMessages.map((message) => {
                  const fromMe = message.senderUserId === profile.id;
                  return (
                    <div key={message.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[76%] rounded-lg px-3 py-2 shadow-sm ${fromMe ? "bg-[#d9fdd3] text-slate-950" : "bg-white text-slate-950"}`}>
                        {selectedConversation.type === "group" && !fromMe && <div className="text-xs font-semibold text-[#008069]">{message.senderName}</div>}
                        <p className="whitespace-pre-wrap text-[15px] leading-6">{message.body}</p>
                        <div className="mt-1 flex justify-end text-[11px] text-slate-500">{formatTime(message.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 bg-[#f0f2f5] p-4">
                <div className="flex items-end gap-3">
                  <Textarea rows={1} value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Type a message" className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-3 shadow-none focus-visible:ring-1 focus-visible:ring-[#25d366]" />
                  <Button onClick={sendMessage} disabled={!messageBody.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-full bg-[#00a884] hover:bg-[#008069]" aria-label="Send message">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-600">Select a chat or start a direct chat from the left.</div>
          )}
        </section>
      </main>
    </div>
  );
}
