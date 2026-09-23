# M06_IMPLEMENTATION_PLAN : REVISION & COACH

## 1. Objectif M06
Transformer l'historique d'apprentissage (M04) et les objectifs (M03) de l'étudiant en une expérience de révision proactive et personnalisée. L'étudiant ne cherche plus quoi faire : le système lui indique ses priorités. Le "Coach IA" (via M05) intervient contextuellement pour débloquer l'apprentissage.

## 2. Non-objectifs
- Pas d'algorithme SRS (Spaced Repetition System type Anki) complexe avec modélisation probabiliste de la courbe d'oubli pour le MVP.
- Pas de génération de nouvelles questions par l'IA ou de création d'exercices virtuels "mélangés". 
- Pas d'appels LLM réels (utilisation exclusive du `MockAIProvider` de M05).
- Pas de création d'une nouvelle architecture IA parallèle.
- Pas de duplication des données pédagogiques (scores, statuts, réponses) de M04.

## 3. Architecture Fonctionnelle & Granularité
La décision architecturale (Validée) est que la **révision démarre systématiquement à partir d'un `learning_exercise` M04 existant**. 
Une `RevisionSession` est un pur mécanisme d'orchestration qui s'appuie sur la vérité pédagogique de M04. 
La session `planned` conserve explicitement l'exercice recommandé afin de pouvoir le lancer dès que l'étudiant clique.

**Flux d'exécution d'une révision :**
1. Création d'une `RevisionSession` ciblant une matière ET un exercice spécifique.
2. Le système délègue l'exécution de cet exercice au Learning Engine M04.
3. M04 crée un `LearningAttempt` classique et enregistre les réponses de l'étudiant.
4. Une entrée `revision_attempts` lie ce `LearningAttempt` à la `RevisionSession`.
5. Le résultat pédagogique est lu directement depuis le `LearningAttempt` (Single Source of Truth). La `RevisionSession` est mise à jour (completed).

## 4. Modèle de données proposé

`revision_sessions` : Orchestration de la révision.
- `id` : UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` : UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
- `subject_id` : UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE
- `learning_exercise_id` : UUID NOT NULL REFERENCES learning_exercises(id) ON DELETE RESTRICT
- `status` : TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'abandoned'))
- `created_at` : TIMESTAMPTZ NOT NULL DEFAULT now()
- `completed_at` : TIMESTAMPTZ
*Justification ON DELETE RESTRICT* : L'historique et l'orchestration de révision (M06) ne doivent pas être supprimés silencieusement si un contenu pédagogique M04 est retiré.
*Règle métier (Server-Side) :* L'exercice défini par `learning_exercise_id` doit obligatoirement appartenir à la matière définie par `subject_id`. Cette cohérence doit être vérifiée côté serveur avant toute création ou modification de session.

`revision_attempts` : Journal de rattachement. Ne duplique AUCUNE donnée pédagogique (pas de score, pas de statut).
- `id` : UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `revision_session_id` : UUID NOT NULL REFERENCES revision_sessions(id) ON DELETE CASCADE
- `learning_attempt_id` : UUID NOT NULL REFERENCES learning_attempts(id) ON DELETE CASCADE
- `order_index` : INTEGER
- `created_at` : TIMESTAMPTZ NOT NULL DEFAULT now()
*Contrainte :* `UNIQUE(revision_session_id, learning_attempt_id)` : Un même attempt ne peut pas être attaché deux fois à la même session de révision.

## 5. Algorithme de Priorité (Priority Engine)

L'algorithme `calculateRevisionPriority(input)` est pur, déterministe et génère exactement le même résultat pour les mêmes données. La sélection est exempte de tout aléa.

**Calcul des Signaux au niveau de l'Exercice (learning_exercise) :**
Pour chaque `learning_exercise`, on agrège les événements M04 sur les 30 derniers jours :
- **Failure Signal** : Tout `learning_attempt` de l'exercice terminé avec `score < max_score`.
  *Poids :* +10 points.
- **Abandonment Signal** : Tout `learning_attempt` de l'exercice avec `status = 'abandoned'`.
  *Poids :* +5 points.
- **Recency Signal** : Multiplicateur de x1.5 appliqué événement par événement si l'événement date de moins de 3 jours.
- **Never-Reviewed Signal** : S'il n'existe aucun `learning_attempt` pour cet utilisateur sur l'exercice.
  *Poids :* +2 points.

**Définition du "Relevant Event" :**
C'est le `created_at` de l'événement (erreur ou abandon) le plus récent. Pour un exercice "Never-Reviewed", ce timestamp est `NULL`.

**Tie-Breaker et Sélection de l'Exercice :**
L'ordre final déterministe pour trier les exercices d'une matière est :
1. `priority_score DESC`
2. `relevant_event_created_at DESC NULLS LAST`
3. `learning_exercise_id ASC`

**Hiérarchie de priorité (Subject -> Exercise) :**
1. **Priorité de la matière (`subject priority`)** : Somme des scores de tous ses exercices (ou score de son exercice prioritaire max). Si le score global est 0, la matière n'est pas priorisée.
2. **Priorité de l'exercice (`exercise priority`)** : Lorsque l'étudiant clique sur une matière, le moteur sélectionne le `learning_exercise` ayant le plus haut score de priorité selon les critères ci-dessus.
3. Ce `learning_exercise_id` déterministe est ensuite injecté dans `revision_sessions.learning_exercise_id`.

**Optimisation SQL (Aggregation) :**
Le calcul s'appuie sur une agrégation SQL bornée aux données où `created_at >= now() - INTERVAL '30 days'`.
Index requis : `CREATE INDEX idx_learning_attempts_user_date ON learning_attempts(user_id, created_at);`

## 6. Contextual Coach (M06) & AI Integration (M05)

Le Coach réutilise **strictement** l'infrastructure M05.
`Revision / M04 UI` → `RevisionCoachContext` → `AIRequest M05` → `AIProvider`

**Définition de `RevisionCoachContext` :**
- `subjectName`: string
- `exerciseTitle`: string
- `questionContent`: string
- `studentAnswer`: string
- `expectedAnswer?`: string (OPTIONNEL : Ne jamais supposer qu'une correction existe systématiquement. Si absente, `null` ou `undefined`).
- `evaluationStatus`: 'incorrect' | 'unanswered'

**Règle de Trust Boundary :**
Les données suivantes sont **formellement interdites** de transfert vers le provider (le backend les garde uniquement pour l'autorisation et le routage interne) :
- `user_id`
- `session_id`
- `revision_session_id`
- `revision_attempt_id`
- `learning_attempt_id`
- `learning_answer_id`
- `learning_question_id`
- tout autre UUID interne
- email, téléphone, ou toute PII.

**Coach Actions (MVP) :**
1. **"Pourquoi ma réponse est incorrecte ?"** (Mode `explain`) : Se concentre sur la différence entre `studentAnswer` et `expectedAnswer`.
2. **"Donne-moi un indice"** (Mode `coach`) : Guide sans donner la réponse.
3. **"Explique ce concept"** (Mode `explain`) : Explicite la notion liée à la `questionContent`.

**Provenance (Alignement Strict avec M05) :**
- `OFFICIAL` : Question ou correction provenant d'une source académique officielle.
- `STUDENT` : Réponse ou contenu fourni par l'étudiant.
- `SYSTEM` : Contenu généré par le système sans validation académique.
- **Le feedback produit par l'IA a TOUJOURS `generatedBy = AI`.**

*Règles absolues :* L'IA n'est jamais une source académique. `generatedBy` et `SourceProvenance` sont deux dimensions distinctes. Le feedback IA ne devient jamais `OFFICIAL`. Si `expectedAnswer` est absente, l'IA ne génère jamais de correction considérée comme officielle.

## 7. Machine d'État de la Session de Révision

- `planned` : L'étudiant a cliqué sur "Réviser", le système a ciblé la matière et pré-sélectionné un `learning_exercise_id`.
- `active` : L'étudiant a démarré l'exercice. Le `learning_attempt` est créé, et le `revision_attempt` est rattaché.
- `completed` : Le `learning_attempt` passe à `completed` dans M04. La `revision_session` est synchronisée à `completed`.
- `abandoned` : L'étudiant quitte explicitement l'exercice. La `revision_session` passe à `abandoned`.
*Reprise* : Une session `abandoned` ou `active` peut être reprise en relançant le `learning_attempt` existant (selon les règles M04).

## 8. UX et Interface (Mobile-First)

**Routes :**
- `/dashboard/revision` : Affiche "À réviser aujourd'hui" avec les cartes des matières (ex: "3 erreurs récentes").
- `/exercise/[id]?revision_session=[id]` : L'UI standard de M04, enrichie du composant Coach.

**Composant Coach :**
- Tiroir contextuel (Bottom Sheet / Drawer) discret.
- N'écrase pas l'expérience M04.

## 9. Sécurité & RLS (Cross-User Protections)

Outre les règles RLS habituelles sur l'ownership (via `user_id = auth.uid()`), **les Server Actions doivent valider impérativement** que :
- User A ne peut pas lire, modifier ou reprendre une `revision_session` de User B.
- User A ne peut pas attacher un `learning_attempt` appartenant à User B dans sa propre `revision_session`.
- User A ne peut pas cibler un `learning_exercise_id` d'une matière qu'il n'a pas le droit de lire (Official ou Open Mode autorisé).
- L'intégrité `revision_sessions.learning_exercise_id` ∈ `revision_sessions.subject_id` est respectée.

## 10. Tests Obligatoires

- **A. Priority Engine** : Unitaire pur. Matière sans donnée = 0. Erreur récente x1.5 vs ancienne x1. Tie-breaker exact.
- **B. Revision Session** : Création avec vérification `learning_exercise_id`, transition des états.
- **C. Revision Attempt** : Impossibilité de violation de l'unicité `(revision_session_id, learning_attempt_id)`. Absence stricte de duplication des scores.
- **D. Coach Context** : Payload sans UUID, sans PII, gestion stricte de la provenance.
- **E. Regressions** : Les flux M03, M04 et M05 restent intacts.

## 11. Découpage en Phases d'Implémentation

### Phase 1 : Data Model & RLS
Migration SQL `revision_sessions` et `revision_attempts` avec clés étrangères et contraintes d'unicité.

### Phase 2 : Priority Engine & Server Actions
Agrégation SQL performante et fonction `calculateRevisionPriority`. Tests unitaires déterministes.

### Phase 3 : Dashboard & Revision UX
Page `/dashboard/revision` et flux de démarrage de session `planned` -> `active`.

### Phase 4 : Coach Context Integration
Enrichissement du Trust Boundary M05 avec `RevisionCoachContext` (filtrage UUID/PII garanti).

### Phase 5 : Interactive Coach UI
Bottom sheet dans l'exercice M04 avec actions `explain` et `coach`.

## 12. Decisions Required Before Implementation
- *Aucune décision métier critique restante. Architecture validée pour implémentation Phase 1.*
