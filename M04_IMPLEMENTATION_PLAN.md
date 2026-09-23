# MONPARCOURS — M04 LEARNING ENGINE

## 1. Objective
Transformer MonParcours d'un cockpit de suivi en un véritable environnement de pratique pédagogique. Le Learning Engine permet aux étudiants de s'entraîner, de se tromper, de recevoir une correction et de mesurer leurs performances. L'objectif immédiat est de construire le socle de données complet (contenu, tentatives, réponses, erreurs) de façon totalement déterministe (sans IA), tout en préparant le terrain pour la consommation future de ces données par l'IA (M05+).

## 2. Product Scope
- **In-Scope** : Modélisation des contenus pédagogiques (QCM, exercices), système de session (attempt), enregistrement granulaire des réponses et erreurs, calcul de score serveur, intégration avec le journal d'activité M03, compatibilité totale avec l'Open Mode.
- **Out-of-Scope** : IA, LLM, RAG, adaptation algorithmique de la difficulté, parcours de maîtrise complexe (mastery learning), gamification, badges, marketplace, import massif de vrais PDF.

## 3. Architecture Overview
L'architecture repose sur un modèle d'extraction d'événements bruts pour construire la performance :
`Academic Context` ➔ `Learning Content` ➔ `Attempt` ➔ `Answer` ➔ `Evaluation (Server)` ➔ `Performance / Activity Log`

Toutes les interactions sont enregistrées au niveau le plus granulaire (la réponse à une question spécifique). Les scores et la progression sont des agrégations de ces événements bruts (évitant la perte d'informations).

## 4. Domain Model
- **Learning Content (Exercise/Quiz)** : Un regroupement de questions constituant une activité d'apprentissage.
- **Question** : L'unité de base d'évaluation, avec différents types possibles (QCM, réponse libre).
- **Choice** : Les options proposées pour un QCM, dont la vérité (bonne/mauvaise) est définie par le créateur.
- **Attempt (Tentative)** : L'enregistrement d'une session de l'étudiant sur un Learning Content (Started, Completed, Abandoned).
- **Answer** : La réponse spécifique d'un étudiant à une question lors d'une tentative, incluant le statut de correction.
- **Performance / Result** : Le score calculé et l'impact sur la progression de la matière.

## 5. Database Model
Pour éviter la confusion avec `student_activities` (M03), les tables de contenus seront préfixées par `learning_`.

1. **`learning_exercises`** : L'enveloppe de l'exercice.
   - `id`, `subject_id` (FK vers subjects), `title`, `description`, `exercise_type` (e.g., 'quiz'), `difficulty`, `created_by` (null = officiel), `created_at`.
2. **`learning_questions`** : Les questions de l'exercice.
   - `id`, `exercise_id` (FK), `question_type` ('single_choice', 'multiple_choice', 'free_text'), `content` (TEXT), `explanation` (TEXT, pour la correction), `order_index`, `difficulty`.
3. **`learning_choices`** : Les options (pour les QCM).
   - `id`, `question_id` (FK), `content` (TEXT), `is_correct` (BOOLEAN), `explanation` (TEXT optionnel).
4. **`learning_attempts`** : La session de l'étudiant.
   - `id`, `user_id` (FK), `exercise_id` (FK), `status` ('started', 'completed', 'abandoned'), `score` (INT), `max_score` (INT), `started_at`, `completed_at`.
5. **`learning_answers`** : Les réponses soumises.
   - `id`, `attempt_id` (FK), `question_id` (FK), `choice_id` (FK, nullable), `free_text_answer` (TEXT, nullable), `is_correct` (BOOLEAN, évalué côté serveur), `submitted_at`.

## 6. Entity Relationships
- `subjects` 1──N `learning_exercises`
- `learning_exercises` 1──N `learning_questions`
- `learning_questions` 1──N `learning_choices`
- `users` 1──N `learning_attempts`
- `learning_exercises` 1──N `learning_attempts`
- `learning_attempts` 1──N `learning_answers`
- `learning_questions` 1──N `learning_answers`

## 7. Attempt / Answer / Result Model
- **Attempt Lifecycle** : L'étudiant déclenche `startAttempt`, créant une entrée `status='started'`. Il navigue et soumet des réponses via `submitAnswer` (enregistre dans `learning_answers`). Enfin, `completeAttempt` fige la tentative (`status='completed'`), calcule le score global et le stocke dans `learning_attempts`.
- **Answers** : L'évaluation (`is_correct`) est stockée au moment de la soumission/complétion. Le client envoie uniquement la donnée de réponse (ex: `choice_id`). Le serveur vérifie dans `learning_choices` si c'est correct et persiste le résultat.

## 8. Performance Model
La performance est calculée par agrégation.
- **Score immédiat** : Stocké dans `learning_attempts` (ex: 7/10).
- **Performance globale** : Pas de table `performance` dédiée dans le MVP. Les KPIs (taux de réussite, erreurs fréquentes) seront calculés "à la volée" via des requêtes d'agrégation sur `learning_attempts` et `learning_answers` filtrées par `subject_id` et `user_id`. Cela garantit que la donnée est toujours fraîche et prévient la désynchronisation.

## 9. Error Tracking
L'Error Tracking est implicite et puissant.
- Trouver les lacunes : Une requête sur `learning_answers` où `is_correct = false`, groupée par `question_id`, permet de savoir exactement ce que l'étudiant rate.
- L'historique d'une erreur (savoir si l'étudiant a fini par la corriger dans une tentative ultérieure) est lisible en triant les tentatives par date pour une même question.
- Cela fournit la structure de données parfaite pour que l'IA (M06) dise : *"Tu as souvent échoué sur cette notion, voici la correction."*

## 10. Difficulty Model
- **Difficulté statique** : Les champs `difficulty` (easy, medium, hard) sur l'exercice et la question représentent la difficulté *déclarée* par le créateur.
- **Difficulté dynamique (future)** : Elle n'est pas codée dans M04, mais l'architecture permet de la calculer plus tard (ex: une question avec 80% de `is_correct=false` chez les étudiants devient statistiquement "hard", peu importe sa difficulté déclarée).

## 11. Activity Integration
Pour ne pas dupliquer inutilement les données entre le Learning Engine et le système `student_activities` (M03) :
- Les données pédagogiques et analytiques détaillées (les questions posées, le choix exact, les timestamps) restent dans `learning_attempts` et `learning_answers`.
- **L'articulation** : Lors du succès d'un `completeAttempt`, un événement de haut niveau est injecté dans `student_activities`.
  - `activity_type` = 'learning_completed'
  - `description` = 'A terminé le quiz : [Titre]'
  - `metadata` = `{ attempt_id: 'uuid', score: 8, max_score: 10 }`
- Cela permet au Dashboard (M03) d'afficher l'activité d'apprentissage dans la timeline sans avoir à requêter les tables du Learning Engine.

## 12. Open Mode Compatibility
- La table `learning_exercises` contient une colonne `created_by`.
- Si `created_by` est NULL, c'est un contenu officiel (FASEG, ou autre établissement défini par un futur `tenant_id`).
- Si `created_by` = `auth.uid()`, c'est un contenu créé par l'étudiant pour ses propres révisions.
- L'architecture est totalement agnostique vis-à-vis de FASEG. Les contenus de test seront simplement rattachés à des sujets génériques ou FASEG à titre d'exemple.

## 13. Security & RLS
- **`learning_exercises`, `learning_questions`, `learning_choices`** : Lecture autorisée pour tout le monde si `created_by IS NULL` OU si `created_by = auth.uid()`. Insertion/Modification autorisée uniquement si `created_by = auth.uid()`.
- **`learning_attempts`, `learning_answers`** : Strictement isolées par l'étudiant.
  - `SELECT`, `INSERT`, `UPDATE` avec `USING (auth.uid() = user_id)`.
  - Pour `learning_answers`, la policy vérifie via une jointure (ou un trigger/Server Action strict) que `attempt_id` appartient bien à l'utilisateur.
- **Prévention de falsification** : Le client n'a jamais l'opportunité de passer `is_correct` ou le `score` dans la requête. Les Server Actions s'en chargent (prévention des IDOR et triche).

## 14. Server Actions
1. `startAttempt(exerciseId: string)` : Vérifie les droits, crée l'Attempt, retourne l'ID de la tentative.
2. `submitAnswer(attemptId: string, questionId: string, answerData: any)` : Évalue la réponse côté serveur contre `learning_choices`, enregistre ou met à jour `learning_answers` avec `is_correct`.
3. `completeAttempt(attemptId: string)` : Clôture la session, calcule le score final, crée l'entrée dans `student_activities`.
4. `getAttemptResult(attemptId: string)` : Récupère le score, les réponses de l'étudiant, et les explications (corrections) à afficher post-quiz.

## 15. UX / Routes
- `/dashboard/learning` : Catalogue des exercices disponibles (filtré par les matières de l'étudiant).
- `/dashboard/learning/[exerciseId]` : Page de présentation du quiz (nombre de questions, difficulté, meilleur score précédent), bouton "Démarrer".
- `/dashboard/learning/[exerciseId]/attempt/[attemptId]` : L'interface de passage.
  - **États** : Loading, affichage de la question en cours, navigation (Suivant/Précédent), "Terminer".
- `/dashboard/learning/[exerciseId]/result/[attemptId]` : Écran de fin. Affichage du score, et review des erreurs (comparaison réponse donnée / bonne réponse / explication).

## 16. Demo / Seed Content
- Aucun RAG, aucune IA.
- Un script de seed (ex: `seed-learning.sql` ou un fichier JSON importé via un script TS) créera 2-3 `learning_exercises` (ex: "Bases de la Microéconomie", "Quiz Culture Générale") liés à des matières.
- Les QCM auront des explications écrites en dur ("La bonne réponse est X parce que...").
- Le contenu sera visuellement tagué comme "Demo Content".

## 17. Validation Strategy (Réponses aux questions architecturales clés)
- *Gestion des choix uniques et multiples* : Géré par le champ `question_type`. Un `single_choice` n'acceptera qu'un seul ID. Un `multiple_choice` acceptera un tableau d'IDs stocké dans `answerData`. Le serveur validera la concordance parfaite pour `is_correct`.
- *Exercices à réponse libre sans IA* : `free_text_answer` peut être stockée. `is_correct` doit valoir NULL tant qu'aucune correction automatique n'existe. La réponse ne doit PAS être considérée comme incorrecte et ne doit PAS diminuer artificiellement le score. Le système distinguera : réponses évaluées automatiquement, réponses correctes, réponses incorrectes, et réponses non évaluées.
- *Évolution d'une question (versioning)* : Pas de versioning complexe. Règle métier : (1) Une correction éditoriale sans changement de sens peut modifier le contenu. (2) Un changement de sens crée une nouvelle question. (3) Ne jamais supprimer une question si cela casse l'historique. (4) Les tentatives historiques restent interprétables grâce au snapshot de l'évaluation figé dans `learning_answers` (empêchant la modification d'une question de changer un vieux score).

## 18. Future AI Compatibility
L'IA (M05/M06) pourra se brancher sur ces données :
- Consommer `learning_answers` pour identifier les points de friction.
- Regarder `learning_attempts` pour la vitesse et l'assiduité.
- Injecter de nouveaux `learning_exercises` générés à la volée, qui s'inséreront parfaitement dans la même base, simplement avec une balise `metadata: { generated_by: 'ai' }`.

## 19. Roadmap Compatibility
M04 est une étape structurante indispensable :
- Sans M04, l'IA de M06 n'aurait aucun historique sur lequel coacher l'étudiant.
- Sans M04, le Simulateur d'Examens (M07) n'aurait pas de moteur d'évaluation.
- M04 reste volontairement découplé de toute logique IA. Il fait très bien une seule chose : collecter les événements d'apprentissage certifiés.

## 20. Risks & Trade-offs
- **Trade-off** : Pas de versioning complexe des questions. (Risque : incohérence mineure si une question est radicalement modifiée après qu'un étudiant y ait répondu. Mitigé par le stockage figé du résultat dans l'Answer).
- **Trade-off** : Calcul dynamique des performances plutôt qu'une table de cache. (Risque : performance sur d'énormes volumes. Mitigé : PostgREST gère très bien l'agrégation sur index. L'optimisation interviendra plus tard si nécessaire).

## 21. Definition of Done
Le M04 sera validé quand :
- Les tables `learning_*` et les politiques RLS seront créées.
- Le contenu Seed de test sera en place (sans dépendance IA).
- Un étudiant pourra démarrer un quiz, répondre, le terminer.
- Le score sera calculé de façon fiable côté serveur.
- L'historique M03 affichera la réalisation du quiz.
- Un étudiant ne pourra voir ni modifier les résultats d'un autre étudiant.

## 22. Implementation Order
1. **Database Foundation** : Migration Supabase pour `learning_exercises`, `questions`, `choices`, `attempts`, `answers` avec RLS strictes.
2. **Seed Data** : Création d'un contenu de démo robuste (QCM simple).
3. **Server Actions (Core)** : Implémentation sécurisée de `startAttempt`, `submitAnswer`, `completeAttempt`.
4. **Integration M03** : Câblage de `completeAttempt` vers `student_activities`.
5. **UI - Discovery** : Écrans liste d'exercices et landing d'exercice.
6. **UI - Engine** : Composant de passage du quiz (navigation questions, soumission, états de chargement).
7. **UI - Results** : Écran de feedback, score et correction détaillée post-quiz.
8. **Testing & Audit** : Vérification des RLS, des failles de triche sur le score, et du comportement multi-users (Open Mode vs FASEG).

## Final Architectural Decisions

**Decision 1 — Free Text**
- Stockage de `free_text_answer`.
- `is_correct` reste `NULL` (aucune correction IA pour l'instant).
- La réponse n'est pas considérée fausse et ne baisse pas le score.
- Les résultats font la distinction entre réponses évaluées automatiquement (correctes/incorrectes) et réponses non évaluées.

**Decision 2 — Content History**
- Aucun système de versioning complexe implémenté.
- Une correction éditoriale peut modifier l'existant.
- Une modification changeant le sens pédagogique crée une nouvelle question.
- On ne supprime pas une question si cela rend l'historique incompréhensible.
- La cohérence historique est garantie par les snapshots (le score et l'évaluation sont figés dans l'Answer au moment de la tentative).

**Decision 3 — Open Mode Content Sharing**
- MVP M04 : Les exercices créés par l'étudiant sont strictement privés (`created_by = auth.uid()`).
- Aucun partage, aucune communauté, aucun marketplace.
- Le modèle reste extensible pour l'avenir sans impact immédiat.
