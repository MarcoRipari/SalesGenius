import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { fetchWithAuth, API_URL, formatRelativeTime } from "../lib/utils";
import { toast } from "sonner";
import {
  MessageCircle,
  User,
  Bot,
  Clock,
  ChevronRight,
  MessageSquare
} from "lucide-react";

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/conversations`);
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (error) {
      toast.error("Errore nel caricamento delle conversazioni");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoadingMessages(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      toast.error("Errore nel caricamento dei messaggi");
    } finally {
      setLoadingMessages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="conversations-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-['Manrope']">Conversazioni</h1>
        <p className="text-muted-foreground">Visualizza tutte le chat con i visitatori</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold font-['Manrope'] mb-2">Nessuna conversazione</h3>
              <p className="text-muted-foreground">
                Le conversazioni con i visitatori appariranno qui
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className="dashboard-card lg:col-span-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {conversations.length} conversazioni
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {conversations.map((conv, index) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <button
                        className={`conversation-item w-full text-left ${
                          selectedConversation?.id === conv.id ? "selected" : ""
                        }`}
                        onClick={() => fetchMessages(conv.id)}
                        data-testid={`conversation-item-${index}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Visitatore #{conv.visitor_id}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {conv.messages_count} msg
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="dashboard-card lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-['Manrope']">
                        Visitatore #{selectedConversation.visitor_id}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatRelativeTime(selectedConversation.started_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="p-4 space-y-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="spinner" />
                        </div>
                      ) : (
                        messages.map((msg, index) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-none"
                                  : "bg-muted rounded-tl-none"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {formatRelativeTime(msg.timestamp)}
                              </p>
                            </div>
                            {msg.role === "user" && (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-secondary-foreground" />
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Seleziona una conversazione per vedere i messaggi</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
