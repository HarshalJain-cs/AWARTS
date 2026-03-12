import { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGate } from '@/components/AuthGate';
import { useAuth } from '@/context/AuthContext';
import { useConversations, useMessages, useSendMessage, useStartConversation, useMarkConversationRead } from '@/hooks/use-api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, ArrowLeft, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import type { Id } from '../../convex/_generated/dataModel';

export default function Messages() {
  return (
    <AuthGate>
      <MessagesContent />
    </AuthGate>
  );
}

function MessagesContent() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  const { data: messages } = useMessages(activeConvId);
  const sendMessage = useSendMessage();
  const startConversation = useStartConversation();
  const markRead = useMarkConversationRead();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle user param to start conversation
  const targetUserId = searchParams.get('user');
  useEffect(() => {
    if (targetUserId && user) {
      startConversation.mutateAsync({ userId: targetUserId as any }).then((convId) => {
        setActiveConvId(convId as string);
        setShowThread(true);
      }).catch(() => {});
    }
  }, [targetUserId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (activeConvId) {
      markRead.mutateAsync({ conversationId: activeConvId } as any).catch(() => {});
    }
  }, [activeConvId]);

  const activeConversation = conversations?.find((c: any) => c._id === activeConvId);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    const content = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessage.mutateAsync({ conversationId: activeConvId, content } as any);
    } catch {
      setMessageInput(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <SEO title="Messages" description="Direct messages with the AWARTS community." noindex />
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="flex h-full">
            {/* Left: Conversation List */}
            <div className={cn(
              'w-full md:w-[340px] md:border-r border-border flex flex-col',
              showThread ? 'hidden md:flex' : 'flex'
            )}>
              <div className="p-4 border-b border-border">
                <h1 className="text-lg font-bold text-foreground">Messages</h1>
              </div>

              <div className="p-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs font-semibold text-foreground">Inbox</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Direct messages with people you follow, discover, or build with.</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {convsLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                          <div className="h-2.5 w-32 bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations && conversations.length > 0 ? (
                  <div>
                    {conversations.map((conv: any) => (
                      <button
                        key={conv._id}
                        onClick={() => { setActiveConvId(conv._id); setShowThread(true); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                          activeConvId === conv._id && 'bg-muted/50'
                        )}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.otherUser?.avatarUrl ?? ''} />
                            <AvatarFallback>{(conv.otherUser?.username ?? '?')[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn('text-sm font-medium truncate', conv.unreadCount > 0 ? 'text-foreground font-semibold' : 'text-foreground')}>
                              @{conv.otherUser?.username}
                            </p>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                {formatMessageTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className={cn('text-xs truncate flex-1', conv.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                              {conv.lastMessagePreview || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Open a public profile and start the conversation.</p>
                    <Link to="/search" className="text-xs text-primary hover:underline mt-2 inline-block">
                      Find people to message
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground">Direct messages</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Keep the feed public, move the specifics into DMs.</p>
              </div>
            </div>

            {/* Right: Message Thread */}
            <div className={cn(
              'flex-1 flex flex-col',
              !showThread ? 'hidden md:flex' : 'flex'
            )}>
              {activeConvId && activeConversation ? (
                <>
                  {/* Thread header */}
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <button
                      onClick={() => setShowThread(false)}
                      className="md:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Link to={`/u/${activeConversation.otherUser?.username}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activeConversation.otherUser?.avatarUrl ?? ''} />
                        <AvatarFallback>{(activeConversation.otherUser?.username ?? '?')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm text-foreground">@{activeConversation.otherUser?.username}</span>
                    </Link>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <AnimatePresence initial={false}>
                      {messages?.map((msg: any) => {
                        const isMine = msg.senderId === user?._id;
                        return (
                          <motion.div
                            key={msg._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                          >
                            <div className={cn(
                              'max-w-[75%] rounded-2xl px-3.5 py-2',
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted text-foreground rounded-bl-md'
                            )}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={cn(
                                'text-[10px] mt-1',
                                isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'
                              )}>
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        maxLength={2000}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!messageInput.trim() || sendMessage.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty state */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3 max-w-xs">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="font-semibold text-foreground">Pick a conversation or start one from a profile.</p>
                    <p className="text-sm text-muted-foreground">
                      AWARTS DMs are built for quick questions, collabs, and follow-up after someone posts a strong session.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
