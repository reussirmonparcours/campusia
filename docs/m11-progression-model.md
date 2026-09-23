# Modèle de Progression & Suivi (M11.8)

L'architecture actuelle permet de relier les données d'apprentissage pour fournir un suivi complet de l'étudiant. Voici comment les différentes entités interagissent pour alimenter le Tuteur IA (ContextBuilder) et les tableaux de bord.

## 1. La Boucle d'Apprentissage (Intelligent Learning Loop)

L'étudiant évolue dans son `Subject Workspace`. Chaque action génère des données qui enrichissent le contexte IA :

1. **Apprentissage** (`documents`, `student_activities`) : Les documents ajoutés ou étudiés déclenchent des résumés ou des questions.
2. **Entraînement** (`learning_exercises`, `learning_attempts`) : La génération de QCM et leurs tentatives fournissent des indicateurs de difficulté et d'erreurs (score < max_score).
3. **Révision** (`ai_sessions`, `ai_messages`) : Les questions posées à l'IA sont persistées et permettent à l'IA de se souvenir des sujets de blocage.

## 2. Intégration pour le ContextBuilder (RAG)

Le `ContextBuilder` (`src/lib/ai/context.ts`) agrège ces points d'intégration :

- **Règle M03 (Activités)** : Les événements de `student_activities` sont récupérés, triés par pertinence (la matière en cours d'abord) puis par récence. Seuls les 5 plus pertinents sont envoyés au LLM.
- **Règle M04 (Tentatives / Erreurs)** : Les `learning_attempts` (scores, abandons) sont analysés. Les échecs ou scores non maximaux ont une priorité pédagogique plus élevée pour que le Tuteur IA puisse cibler les points faibles.
- **Contextualisation Matière** : L'ID de la matière (`subjectId`) restreint la recherche RAG (via `validateSubjectAccess`) et donne à l'IA le contexte exact (nom et description de la matière).

## 3. Évolutions futures (M12)

- **Graphe de Compétences** : Mappage des erreurs (`learning_attempts`) sur un graphe de sous-chapitres.
- **Progression IA Avancée** : L'IA pourra suggérer de manière proactive des fiches de révision basées sur la fréquence des erreurs.
