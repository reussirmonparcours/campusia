"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Send, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCoachHistory, sendRevisionCoachMessage } from "@/lib/revision/coach-actions";

interface CoachChatProps {
  attemptId: string;
  questionId: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  generatedBy?: string;
}

export function CoachChat({ attemptId, questionId }: CoachChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !sessionId && !isHistoryLoading && messages.length === 0) {
      let isMounted = true;
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        const res = await getCoachHistory(attemptId, questionId);
        if (!isMounted) return;
        setIsHistoryLoading(false);
        if (res.success && res.sessionId) {
          setSessionId(res.sessionId);
          if (res.messages) {
            setMessages(res.messages);
          }
        }
      };
      fetchHistory();
      return () => { isMounted = false; };
    }
  }, [isOpen, attemptId, questionId, sessionId, isHistoryLoading, messages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || isHistoryLoading) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    setError(null);
    setIsLoading(true);

    const newMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: userMsg };
    setMessages((prev) => [...prev, newMsg]);

    const res = await sendRevisionCoachMessage(attemptId, questionId, userMsg);

    setIsLoading(false);

    if (res.error) {
      setError(res.error);
      // Remove the optimistic message on error so user can retry typing
      setMessages((prev) => prev.filter(m => m.id !== newMsg.id));
      setInputValue(userMsg);
    } else if (res.success && res.message) {
      if (res.sessionId && !sessionId) {
        setSessionId(res.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: res.message!,
          generatedBy: res.generatedBy
        }
      ]);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950" aria-label="Discuter avec le coach pour cette question">
          <MessageCircle className="w-4 h-4 mr-2" />
          Comprendre mon erreur avec le Coach
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:w-[450px] flex flex-col h-full p-0 sm:max-w-md">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Coach de Révision
          </SheetTitle>
          <SheetDescription>
            Demandez des explications sur cette question.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {isHistoryLoading ? (
            <div className="text-center text-muted-foreground my-auto flex flex-col items-center">
              <RefreshCw className="w-12 h-12 mb-4 opacity-20 animate-spin" />
              <p>Recherche de l&apos;historique...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground my-auto flex flex-col items-center">
              <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>Posez une question pour commencer.</p>
              <p className="text-sm mt-2 opacity-70">Ex: Pourquoi ma réponse est-elle fausse ?</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground self-end"
                    : "bg-muted self-start"
                }`}
              >
                <span className="text-sm">{msg.content}</span>
                {msg.generatedBy === "AI" && (
                  <span className="text-[10px] opacity-70 mt-1 uppercase font-semibold">Coach AI</span>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="bg-muted self-start rounded-lg p-3 animate-pulse">
              <span className="text-sm">Le coach réfléchit...</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <Button size="sm" variant="ghost" onClick={handleSend} className="h-6 w-6 p-0 shrink-0">
                <RefreshCw className="w-4 h-4" />
                <span className="sr-only">Réessayer</span>
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Saisissez votre question..."
              disabled={isLoading || isHistoryLoading}
              aria-label="Saisissez votre question"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || isHistoryLoading || !inputValue.trim()} size="sm" className="shrink-0 h-10 w-10 p-0">
              <Send className="w-4 h-4" />
              <span className="sr-only">Envoyer</span>
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
