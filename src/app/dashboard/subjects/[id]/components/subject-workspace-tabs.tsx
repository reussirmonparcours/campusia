"use client";

import { useState } from "react";
import { AIChatPanel } from "@/components/dashboard/ai/AIChatPanel";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { DocumentList } from "./document-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SubjectWorkspaceTabsProps {
  subjectId: string;
  activities: any[];
  documents: any[];
}

export function SubjectWorkspaceTabs({ subjectId, activities, documents }: SubjectWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState("apprendre");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("apprendre")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "apprendre" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Apprendre
        </button>
        <button
          onClick={() => setActiveTab("entrainer")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "entrainer" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          S'entraîner
        </button>
        <button
          onClick={() => setActiveTab("suivi")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "suivi" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Suivi & Progression
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "apprendre" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Mes documents de cours</CardTitle>
                  <UploadDocumentDialog subjectId={subjectId} />
                </CardHeader>
                <CardContent>
                  <DocumentList documents={documents || []} />
                </CardContent>
              </Card>
            </div>
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Tuteur IA</h3>
                <p className="text-xs text-slate-500">Posez vos questions sur la matière ou les documents.</p>
              </div>
              <AIChatPanel subjectId={subjectId} />
            </div>
          </div>
        )}

        {activeTab === "entrainer" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exercices & QCM</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Aucun entraînement n'est disponible.</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    L'IA peut générer des exercices basés sur vos documents pour tester vos connaissances.
                  </p>
                  <button disabled className="px-4 py-2 bg-slate-200 text-slate-500 rounded-md text-sm font-medium cursor-not-allowed">
                    Créer un entraînement (Bientôt disponible)
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "suivi" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique de la matière</CardTitle>
              </CardHeader>
              <CardContent>
                {!activities || activities.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    Aucune activité enregistrée pour cette matière.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="mt-1 h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
