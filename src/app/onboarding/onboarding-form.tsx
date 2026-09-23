"use client";

import * as React from "react";
import { completeOnboarding } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InstitutionItem {
  id: string;
  name: string;
  type: string;
  code: string;
  country: string;
}

interface AcademicUnitItem {
  id: string;
  institution_id: string;
  name: string;
  type: string;
  code: string;
}

interface ProgramItem {
  id: string;
  name: string;
  cycle: string;
  academic_unit_id: string;
}

interface TrackItem {
  id: string;
  name: string;
  code: string | null;
  program_id: string;
}

interface SemesterItem {
  id: string;
  program_id: string;
  semester_number: number;
  total_credits: number | null;
}

interface OnboardingFormProps {
  initialProfile?: {
    first_name?: string;
    last_name?: string;
    display_name?: string | null;
    program_id?: string | null;
    current_track_id?: string | null;
    current_semester_id?: string | null;
    custom_institution?: string | null;
    custom_program?: string | null;
    custom_level?: string | null;
    registration_year?: string | null;
  } | null;
  institutions: InstitutionItem[];
  academicUnits: AcademicUnitItem[];
  programs: ProgramItem[];
  tracks: TrackItem[];
  semesters: SemesterItem[];
  specializedSemesterIds: string[];
  programSubjects: { semester_id: string; track_id: string | null }[];
}

export function OnboardingForm({
  initialProfile,
  institutions,
  academicUnits,
  programs,
  tracks,
  semesters,
  specializedSemesterIds = [],
  programSubjects = [],
}: OnboardingFormProps) {
  const [state, formAction, isPending] = React.useActionState(completeOnboarding, null);

  const defaultInstitutionId = institutions[0]?.id ?? "";
  const defaultAcademicUnitId = academicUnits[0]?.id ?? "";

  const [selectedProgramId, setSelectedProgramId] = React.useState(
    initialProfile?.program_id ?? programs[0]?.id ?? ""
  );

  const [selectedTrackId, setSelectedTrackId] = React.useState(
    initialProfile?.current_track_id ?? ""
  );

  const availableSemesters = React.useMemo(() => {
    return semesters.filter((s) => s.program_id === selectedProgramId);
  }, [semesters, selectedProgramId]);


  const [selectedSemesterId, setSelectedSemesterId] = React.useState(
    initialProfile?.current_semester_id ?? ""
  );

  const effectiveSemesterId = availableSemesters.some((s) => s.id === selectedSemesterId)
    ? selectedSemesterId
    : availableSemesters[0]?.id ?? "";

  const availableTracks = React.useMemo(() => {
    const programTracks = tracks.filter((t) => t.program_id === selectedProgramId);
    if (!effectiveSemesterId) return programTracks;

    const activeTrackIds = new Set(
      programSubjects
        .filter((ps) => ps.semester_id === effectiveSemesterId && ps.track_id !== null)
        .map((ps) => ps.track_id)
    );

    if (activeTrackIds.size > 0) {
      return programTracks.filter((t) => activeTrackIds.has(t.id));
    }
    return programTracks;
  }, [tracks, selectedProgramId, effectiveSemesterId, programSubjects]);

  const isSpecializedSemester = specializedSemesterIds.includes(effectiveSemesterId);
  
  // Si le semestre n'est pas spécialisé, on force le tronc commun
  React.useEffect(() => {
    if (!isSpecializedSemester && selectedTrackId !== "") {
      setSelectedTrackId("");
    }
  }, [isSpecializedSemester, selectedTrackId]);

  const isOpenMode = selectedProgramId === "";

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextProgramId = e.target.value;
    setSelectedProgramId(nextProgramId);
    setSelectedTrackId("");
    const nextSemesters = semesters.filter((s) => s.program_id === nextProgramId);
    if (nextSemesters[0]) {
      setSelectedSemesterId(nextSemesters[0].id);
    } else {
      setSelectedSemesterId("");
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/50 dark:border-red-900 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Section 1 : Identité de l'étudiant */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          1. Identité
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Prénom"
            name="firstName"
            required
            defaultValue={initialProfile?.first_name ?? ""}
            placeholder="Ex: Kodjo"
          />
          <Input
            label="Nom de famille"
            name="lastName"
            required
            defaultValue={initialProfile?.last_name ?? ""}
            placeholder="Ex: Agbéyomé"
          />
        </div>
        <Input
          label="Nom d'affichage (optionnel)"
          name="displayName"
          defaultValue={initialProfile?.display_name ?? ""}
          placeholder="Ex: Kodjo A."
          helperText="Nom affiché dans l'interface et vos interactions d'apprentissage."
        />
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* Section 2 : Établissement académique */}
      {!isOpenMode && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            2. Établissement &amp; Unité académique
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Institution (Université / École)
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 opacity-50 cursor-not-allowed"
                defaultValue={defaultInstitutionId}
                disabled
              >
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.code}) — {i.country}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Unité Académique (Faculté / Institut)
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 opacity-50 cursor-not-allowed"
                defaultValue={defaultAcademicUnitId}
                disabled
              >
                {academicUnits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {isOpenMode && (
        <div className="space-y-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            2. Mode Ouvert
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Votre établissement n&apos;est pas encore référencé officiellement. Déclarez librement votre formation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Établissement (Ex: ESG Paris)"
              name="customInstitution"
              defaultValue={initialProfile?.custom_institution ?? ""}
              required={isOpenMode}
            />
            <Input
              label="Formation (Ex: Bachelor Finance)"
              name="customProgram"
              defaultValue={initialProfile?.custom_program ?? ""}
              required={isOpenMode}
            />
            <Input
              label="Niveau actuel (Ex: L3)"
              name="customLevel"
              defaultValue={initialProfile?.custom_level ?? ""}
              required={isOpenMode}
            />
          </div>
        </div>
      )}

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* Section 3 : Parcours & Semestre */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          3. Parcours &amp; Semestre en cours
        </h3>

        <div className="space-y-1.5">
          <label htmlFor="programId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Programme de formation (Diplôme)
          </label>
          <select
            id="programId"
            name="programId"
            value={selectedProgramId}
            onChange={handleProgramChange}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Sélectionnez un programme (Mode ouvert)</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cycle})
              </option>
            ))}
          </select>
        </div>

        {isSpecializedSemester ? (
          <div className="space-y-1.5">
            <label htmlFor="trackId" className="block text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Votre parcours / spécialité
            </label>
            <select
              id="trackId"
              name="trackId"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-emerald-700 dark:bg-slate-900 dark:text-slate-100"
              disabled={!selectedProgramId || availableTracks.length === 0}
              required
            >
              <option value="">Sélectionnez votre parcours</option>
              {availableTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.code ? `(${t.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5 opacity-70">
            <label htmlFor="trackId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Spécialité / Parcours
            </label>
            <div className="flex h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 items-center dark:border-slate-700 dark:bg-slate-900/50">
              Tronc commun
              <span className="ml-2 text-xs">(Ce semestre est commun à tous les parcours)</span>
            </div>
            <input type="hidden" name="trackId" value="" />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="semesterId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Semestre d&apos;études actuel
            </label>
            <select
              id="semesterId"
              name="semesterId"
              value={effectiveSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 disabled:opacity-50"
              disabled={isOpenMode || availableSemesters.length === 0}
            >
              {isOpenMode && <option value="">Mode Ouvert (Non applicable)</option>}
              {!isOpenMode && availableSemesters.length === 0 && <option value="">Indisponible</option>}
              {!isOpenMode && availableSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semestre {s.semester_number} {s.total_credits ? `(${s.total_credits} crédits)` : ""}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Année académique"
            name="registrationYear"
            defaultValue={initialProfile?.registration_year ?? "2024-2025"}
            placeholder="2024-2025"
            helperText="Format AAAA-AAAA"
          />
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Validation et initialisation du parcours..." : "Valider mon parcours académique"}
        </Button>
      </div>
    </form>
  );
}
