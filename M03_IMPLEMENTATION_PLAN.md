# M03_IMPLEMENTATION_PLAN.md
# M03: STUDENT EXPERIENCE CORE

## M03 Architectural Corrections — Review 2

Suite à la deuxième revue architecturale, plusieurs ajustements critiques ont été apportés au plan initial avant de démarrer l'implémentation.

### 1. Extensibilité de `student_activities`
- **Problème** : Le modèle d'activités doit pouvoir accueillir de futurs usages (exercices, QCM, Liya, examens) sans modification structurelle majeure.
- **Décision** : Le schéma de `student_activities` inclut désormais les colonnes `provenance` (ex: `manual`, `system`, `liya`) et `result` (JSONB pour stocker un score, une durée, une note). Le type d'activité `activity_type` reste un `TEXT` libre (plutôt qu'un `ENUM` restrictif) avec des conventions de nommage applicatives.
- **Justification** : Cela permet d'étendre les types d'activités sans toucher au schéma SQL à l'avenir.
- **Impact** : L'interface M03 affichera les activités génériques, mais le socle de données est prêt.

### 2. Sécurité Mode Ouvert et `subject_id`
- **Problème** : Un utilisateur (USER_A) ne doit pas pouvoir associer un objectif ou une activité à une matière privée (custom subject) appartenant à USER_B.
- **Décision** : Les politiques RLS (Row Level Security) sur `student_activities` et `student_objectives` incluront une validation stricte du `subject_id` lors du `INSERT` et `UPDATE`.
- **Justification** : L'isolation des données doit être garantie côté base de données, pas seulement via l'UI.
- **Impact** : RLS renforcée : `subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid()))`.

### 3. Statuts d'apprentissage et Conflits
- **Problème** : Le statut d'apprentissage d'une matière peut être modifié manuellement dans M03, ce qui risque de créer un conflit avec le futur moteur d'évaluation IA.
- **Décision** : M03 n'implémente que la modification manuelle. Le statut reste dans `student_subject_progress`. Pour tracer les décisions manuelles, toute modification via l'UI générera une entrée dans `student_activities` avec `provenance = 'manual'`.
- **Justification** : Le futur moteur IA pourra se baser sur la date de la dernière activité `manual` pour savoir s'il doit "overrider" ou non un statut.
- **Impact** : Transparence totale des changements d'état sans ajouter de colonnes complexes.

### 4. Logique du Focus du jour (Déterministe)
- **Problème** : Le "Focus du jour" doit être pertinent sans utiliser d'IA ou d'algorithmes complexes.
- **Décision** : La logique sera purement déterministe (TypeScript) basée sur un ordre de priorité strict :
  1. Un objectif `in_progress` dont la `target_date` est dans les 3 prochains jours.
  2. À défaut, la matière ayant le statut `a_reviser` (triée par la date de mise à jour la plus ancienne).
  3. À défaut, la matière récemment consultée/modifiée (basé sur `student_activities`).
- **Justification** : Fournit une vraie utilité immédiate avec des requêtes SQL/Supabase très simples.

### 5. Retrait des "Coming Soon" (UI Futures Features)
- **Problème** : Les sections désactivées pour les Documents, QCM et Liya surchargent l'interface inutilement.
- **Décision** : L'interface M03 sera épurée. Les onglets et boutons liés aux features futures (M04/M05) ne seront pas affichés artificiellement.
- **Justification** : Une UI fonctionnelle et propre vaut mieux qu'une UI remplie d'options non cliquables.

---

## A. Objectif M03
Construire le cœur de l'expérience étudiant de MonParcours. Transformer le socle de données M02 en un véritable environnement d'apprentissage dynamique et structuré, permettant à l'étudiant de se repérer dans son cursus, de visualiser ses matières, de suivre son apprentissage, de se fixer des objectifs et de tracer son activité. 

## B. Fonctionnalités M03
- **Cockpit Étudiant (Dashboard)** : Vue d'ensemble claire du contexte académique, de la progression, des priorités et des activités récentes.
- **Parcours Académique** : Navigation cohérente et hiérarchique dans le cursus, compatible Mode Ouvert et FASEG.
- **Gestion des Matières** : Vues détaillées par matière incluant le statut d'apprentissage et la progression.
- **Moteur de Progression (Socle)** : Suivi de l'état (en_cours, a_reviser, comprise, maitrisee).
- **Objectifs Étudiants** : Définition et suivi d'objectifs déterministes.
- **Historique d'Activité** : Journalisation structurée et extensible des actions de l'étudiant.

## C. Fonctionnalités explicitement hors scope
- PDF, upload de documents, OCR, extraction de documents.
- Embeddings, RAG, Knowledge Base.
- API OpenAI, ChatGPT, appels LLM.
- QCM avancés, générateur d'exercices IA, coach IA, simulateur d'examen complet.
- Recommandations intelligentes (Focus du jour via IA).
- Faux boutons "Coming Soon" dans l'UI.

## D. Audit du repository actuel
L'audit du dépôt révèle une base saine (Next.js App Router, Tailwind, Shadcn UI) :
- **Dashboard actuel** : `src/app/dashboard/page.tsx` implémente déjà une excellente lecture du `AcademicContext`. Il affiche le contexte officiel (FASEG) et le Mode Ouvert, et remonte les métriques de base.
- **Onboarding** : `src/app/onboarding/page.tsx` fonctionne bien pour initialiser le profil étudiant (Mode FASEG ou Ouvert).
- **Types & Context** : `src/types/academic.ts` et `src/lib/academic/context.ts` forment une base solide (DTO `AcademicContext` très bien structuré).
- **M02 Tables** : Le schéma de base de données (profils, progression, catalogue) est opérationnel et les RLS protègent bien l'isolation des données par `user_id`.
- **Réutilisation** : Le dashboard existant sera refondu/étendu plutôt que remplacé.

## E. Architecture UX
- **Hiérarchie claire** : Réduire la surcharge cognitive. Un étudiant doit savoir instantanément *où il en est* et *ce qu'il doit faire*.
- **Navigation contextuelle** : Topnav ou Sidebar simple avec "Tableau de bord", "Mes Matières", "Mes Objectifs", "Historique".
- **Composants atomiques** : Création de composants réutilisables (ex: `SubjectProgressCard`, `ActivityTimeline`, `ObjectiveItem`).

## F. Architecture navigation
- `/dashboard` : Cockpit central (Overview).
- `/dashboard/subjects` : Liste de toutes les matières du semestre.
- `/dashboard/subjects/[id]` : Vue détaillée d'une matière (statut, crédits, historique de la matière).
- `/dashboard/objectives` : Gestion des objectifs personnels.
- `/dashboard/activity` : Historique complet chronologique.
- `/dashboard/settings/academic` : Accès à l'onboarding pour modification du cursus.

## G. Architecture dashboard
Le Dashboard est épuré pour éviter la surcharge. Il se compose strictement de :
1. **Contexte académique** : Rappel du profil (Institution > Programme > Niveau).
2. **Focus du jour** : Bloc d'appel à l'action déterministe (Objectif prioritaire ou matière à réviser).
3. **Progression (KPIs)** : Chiffres clés (Matières suivies, maîtrisées).
4. **Activité récente** : Liste condensée des dernières actions.
5. **Aperçu des matières / Objectifs** : Accès rapide aux éléments clés.

## H. Architecture matières
- **Vue Liste** : Fiches matières avec statut actuel.
- **Vue Détail** : Informations de base de la matière, possibilité de basculer le statut d'apprentissage manuellement (`en_cours`, `a_reviser`, `comprise`, `maitrisee`), affichage des derniers événements liés à cette matière.

## I. Architecture progression
- Basé sur la table `student_subject_progress`.
- M03 gère uniquement la modification *manuelle* des statuts et du flag `is_flagged_difficult`.
- Toute modification génère une ligne dans `student_activities` permettant la traçabilité.

## J. Architecture objectifs
- **Entité Conceptuelle** : `student_objectives`
- **Utilisation** : L'étudiant crée un objectif (ex: "Valider le cours d'éco"), l'associe éventuellement à une matière, fixe une date cible et gère l'état (`in_progress`, `achieved`).
- **Gestion** : UI simple pour cocher/marquer comme atteint.

## K. Architecture historique
- **Entité Conceptuelle** : `student_activities`
- **Utilisation** : Architecture robuste prête pour accueillir tous les futurs logs d'apprentissage (QCM, Liya, temps passé). Dans M03, enregistre les créations d'objectifs, changements de statut, et connexions.

## L. Architecture Mode Ouvert
- Le système ne repose pas sur les catalogues officiels FASEG de façon stricte.
- Le dashboard affiche `custom_institution`, `custom_program`, `custom_level`.
- Les matières personnalisées créées par l'étudiant (`created_by = auth.uid()`) se comportent exactement comme des matières officielles dans les vues de matières, progression, objectifs et activités.

## M. Architecture Data

Les deux nouvelles tables essentielles :

### 1. `student_objectives`
- `id` : UUID, PK, DEFAULT gen_random_uuid()
- `user_id` : UUID, NOT NULL, FK vers `auth.users(id)` ON DELETE CASCADE
- `subject_id` : UUID, NULLABLE, FK vers `subjects(id)` ON DELETE SET NULL
- `title` : TEXT, NOT NULL
- `objective_type` : TEXT, NOT NULL, CHECK (objective_type IN ('subject', 'revision', 'progression', 'general'))
- `status` : TEXT, NOT NULL, DEFAULT 'in_progress', CHECK (status IN ('in_progress', 'achieved', 'cancelled'))
- `target_date` : TIMESTAMPTZ, NULLABLE
- `created_at` : TIMESTAMPTZ, NOT NULL DEFAULT now()
- `updated_at` : TIMESTAMPTZ, NOT NULL DEFAULT now()

### 2. `student_activities`
- `id` : UUID, PK, DEFAULT gen_random_uuid()
- `user_id` : UUID, NOT NULL, FK vers `auth.users(id)` ON DELETE CASCADE
- `subject_id` : UUID, NULLABLE, FK vers `subjects(id)` ON DELETE SET NULL
- `activity_type` : TEXT, NOT NULL (ex: 'status_changed', 'objective_created')
- `description` : TEXT, NOT NULL
- `provenance` : TEXT, NOT NULL DEFAULT 'manual' (ex: 'manual', 'system', 'liya')
- `metadata` : JSONB, NULLABLE DEFAULT '{}'::jsonb (pour stocker d'anciens/nouveaux statuts)
- `result` : JSONB, NULLABLE (pour stocker plus tard les scores/temps)
- `created_at` : TIMESTAMPTZ, NOT NULL DEFAULT now()

## N. Sécurité et RLS (CRITIQUE)
Toute donnée privée doit garantir un cloisonnement strict par `user_id`.
Pour `student_objectives` et `student_activities` :
- **SELECT / DELETE** : `auth.uid() = user_id`.
- **INSERT / UPDATE** : 
  1. `auth.uid() = user_id`.
  2. Vérification de `subject_id` : L'utilisateur ne peut lier qu'une matière officielle (`created_by IS NULL`) ou une matière personnalisée lui appartenant (`created_by = auth.uid()`). 
  *Politique `WITH CHECK` requise :*
  `subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects WHERE id = subject_id AND (created_by IS NULL OR created_by = auth.uid()))`

## O. Index nécessaires
- `idx_student_objectives_user_id` ON `student_objectives(user_id)`
- `idx_student_objectives_subject_id` ON `student_objectives(subject_id)`
- `idx_student_activities_user_id` ON `student_activities(user_id)`
- `idx_student_activities_subject_id` ON `student_activities(subject_id)`
- `idx_student_activities_created_at` ON `student_activities(created_at DESC)` (pour afficher le feed rapidement)

## P. Server Components / Server Actions
- **Server Components** : Affichage SSR du Dashboard et des vues listes. Requêtes directes via le client Supabase `server`.
- **Server Actions** :
  - `createObjective` / `updateObjective`
  - `updateSubjectProgress` (avec injection automatique de la ligne `student_activities` correspondante).

## Q. États loading/error/empty
- `loading.tsx` avec Skeleton UIs pour maintenir la fluidité perçue.
- `error.tsx` avec bouton "Réessayer".
- **Empty States** : Essentiels pour `/dashboard/objectives` (Pas encore d'objectifs) et `/dashboard/activity` (Pas encore d'activité).

## R. Responsive/mobile
- Grilles responsives (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
- Barres de navigation adaptées (Hamburger sur mobile).

## S. Tests prévus
- Validation RLS Runtime sur les nouvelles tables (Insert avec un `subject_id` de USER_B doit échouer pour USER_A).
- Vérification du comportement déterministe du *Focus du jour*.

## T. Definition of Done M03
- [ ] Le dashboard est fonctionnel, épuré, affiche la progression de base, le "Focus du jour" et l'historique récent.
- [ ] La navigation permet l'accès aux Matières, Objectifs et Activités.
- [ ] L'étudiant peut ajuster manuellement ses statuts d'apprentissage.
- [ ] L'étudiant peut gérer ses objectifs.
- [ ] Le journal d'activités trace correctement et automatiquement les changements manuels.
- [ ] L'expérience est 100% compatible Mode Ouvert sans frictions.
- [ ] RLS implémentée et vérifiée (impossible d'exploiter un `subject_id` privé externe).
- [ ] UI "Mobile-first", avec gestion des Empty/Loading/Error states.
- [ ] Le projet compile, typecheck OK, lint OK (`npm run lint`, `npm run build`).
- [ ] Aucune régression par rapport au socle M02 (Onboarding intact).
- [ ] AUCUNE interface "Coming Soon" inutile n'a été implémentée (pas de PDF, de chat Liya, ni QCM).
