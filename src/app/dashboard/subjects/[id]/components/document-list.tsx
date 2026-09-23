"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentDocument, retryIngestion } from "@/lib/rag/actions";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, RefreshCw, FileText, CheckCircle2, AlertCircle, Loader2, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocumentMetadata {
  file_name?: string;
  document_type?: string;
  error?: string;
}

interface Document {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  metadata: DocumentMetadata | null;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
}

const TYPE_LABELS: Record<string, string> = {
  COURSE: "Cours",
  TD: "TD",
  EXAM: "Annales",
  NOTES: "Notes",
  OTHER: "Autre"
};

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.")) return;
    
    try {
      setIsDeleting(id);
      await deleteStudentDocument(id);
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      setIsRetrying(id);
      await retryIngestion(id);
      router.refresh();
    } catch (err) {
      console.error("Retry error:", err);
      alert("Erreur lors de la tentative de ré-analyse.");
    } finally {
      setIsRetrying(null);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        Aucun document personnel ajouté pour cette matière.
      </div>
    );
  }

  const renderStatus = (status: string, error?: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1 bg-slate-100 text-slate-600"><Hourglass className="h-3 w-3" /> En attente</Badge>;
      case "processing":
        return <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-600 border-blue-200"><Loader2 className="h-3 w-3 animate-spin" /> Analyse...</Badge>;
      case "completed":
        return <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3" /> Prêt (IA)</Badge>;
      case "failed":
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant="error" className="gap-1"><AlertCircle className="h-3 w-3" /> Échec</Badge>
            {error && <span className="text-xs text-red-500 max-w-[200px] truncate" title={error}>{error}</span>}
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const typeLabel = doc.metadata?.document_type ? TYPE_LABELS[doc.metadata.document_type] || "Autre" : "Document";
        const fileName = doc.metadata?.file_name || "Document sans nom";

        return (
          <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-950">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate" title={fileName}>
                  {fileName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider">
                    {typeLabel}
                  </Badge>
                  <span className="text-[10px] text-slate-500">
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 pl-4">
              <div className="hidden sm:block">
                {renderStatus(doc.status, doc.metadata?.error)}
              </div>

              <div className="flex items-center gap-1">
                {doc.status === "failed" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-slate-500 hover:text-blue-600"
                    title="Réessayer l'analyse"
                    onClick={() => handleRetry(doc.id)}
                    disabled={isRetrying === doc.id || isDeleting === doc.id}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRetrying === doc.id ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 text-slate-500 hover:text-red-600"
                  title="Supprimer"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isDeleting === doc.id || isRetrying === doc.id}
                >
                  {isDeleting === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
