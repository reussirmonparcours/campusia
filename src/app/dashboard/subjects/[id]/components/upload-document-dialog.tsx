"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerStudentDocument } from "@/lib/rag/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UploadCloud, Loader2 } from "lucide-react";

interface UploadDocumentDialogProps {
  subjectId: string;
}

const DOCUMENT_TYPES = [
  { value: "COURSE", label: "Cours" },
  { value: "TD", label: "TD / Exercices" },
  { value: "EXAM", label: "Annales" },
  { value: "NOTES", label: "Notes personnelles" },
  { value: "OTHER", label: "Autre" }
];

export function UploadDocumentDialog({ subjectId }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("COURSE");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validation: 30MB max
      if (selectedFile.size > 30 * 1024 * 1024) {
        setError("Le fichier dépasse la limite de 30MB.");
        setFile(null);
        return;
      }
      
      // Validation: PDF
      if (selectedFile.type !== "application/pdf") {
        setError("Seuls les fichiers PDF sont acceptés.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Vous devez être connecté.");

      const fileId = crypto.randomUUID();
      const storagePath = `${user.id}/${fileId}.pdf`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("pedagogical-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      // 2. Register document via Server Action
      await registerStudentDocument(
        storagePath,
        subjectId,
        docType,
        file.name
      );

      // 3. Close & Refresh
      setOpen(false);
      setFile(null);
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Ajouter un document
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Ajouter un document</SheetTitle>
          <SheetDescription>
            Importez vos cours, TD ou annales (PDF uniquement, max 30MB).
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="doc-type" className="text-sm font-medium leading-none">Type de document</label>
            <select 
              id="doc-type" 
              value={docType} 
              onChange={(e) => setDocType(e.target.value)} 
              disabled={isUploading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="file" className="text-sm font-medium leading-none">Fichier PDF</label>
            <Input 
              id="file" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium">
              {error}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              "Envoyer"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
