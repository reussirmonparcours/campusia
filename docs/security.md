# Architecture de Sécurité & Stratégie RLS — MonParcours

Ce document détaille la matrice de sécurité, la politique Row Level Security (RLS) et les règles d'isolation multi-utilisateurs implémentées pour le Milestone 02.

---

## 1. Principes d'Isolation

1. **Aucun secret exposé au client** :  
   `SUPABASE_SERVICE_ROLE_KEY` est strictement réservé au serveur (`server-only`). Le client navigateur n'utilise que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. **Identification certifiée** :  
   L'identité de l'utilisateur n'est jamais déterminée à partir de données envoyées dans le corps de la requête ou dans des paramètres d'URL. Elle provient obligatoirement de `auth.uid()` certifié par le jeton JWT validé par Supabase.
3. **Privilèges PostgreSQL minimaux** :  
   - Le rôle `anon` (non authentifié) a tous ses privilèges révoqués sur les tables publiques (`REVOKE ALL FROM anon`).
   - Le rôle `authenticated` dispose de `SELECT` sur le catalogue académique et de permissions CRUD strictement filtrées par RLS sur ses propres données.

---

## 2. Matrice des Politiques RLS (Row Level Security)

| Table | Rôle ciblé | Opération | Clause `USING` | Clause `WITH CHECK` |
| :--- | :--- | :--- | :--- | :--- |
| `universities` | `authenticated` | `SELECT` | `true` | — |
| `faculties` | `authenticated` | `SELECT` | `true` | — |
| `programs` | `authenticated` | `SELECT` | `true` | — |
| `tracks` | `authenticated` | `SELECT` | `true` | — |
| `semesters` | `authenticated` | `SELECT` | `true` | — |
| `subjects` | `authenticated` | `SELECT` | `true` | — |
| `semester_subjects`| `authenticated` | `SELECT` | `true` | — |
| `student_profiles` | `authenticated` | `SELECT` | `auth.uid() = user_id` | — |
| `student_profiles` | `authenticated` | `INSERT` | — | `auth.uid() = user_id` |
| `student_profiles` | `authenticated` | `UPDATE` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `student_profiles` | `authenticated` | `DELETE` | `auth.uid() = user_id` | — |
| `student_subject_progress` | `authenticated` | `SELECT` | `auth.uid() = user_id` | — |
| `student_subject_progress` | `authenticated` | `INSERT` | — | `auth.uid() = user_id` |
| `student_subject_progress` | `authenticated` | `UPDATE` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `student_subject_progress` | `authenticated` | `DELETE` | `auth.uid() = user_id` | — |
| `pedagogical_documents` | `authenticated` | `SELECT` | `visibility = 'institutional' OR (visibility = 'private' AND auth.uid() = uploader_id)` | — |
| `pedagogical_documents` | `authenticated` | `INSERT` | — | `auth.uid() = uploader_id AND is_official = false AND visibility = 'private'` |
| `pedagogical_documents` | `authenticated` | `UPDATE` | `auth.uid() = uploader_id AND is_official = false` | `auth.uid() = uploader_id AND is_official = false AND visibility = 'private'` |
| `pedagogical_documents` | `authenticated` | `DELETE` | `auth.uid() = uploader_id AND is_official = false` | — |

---

## 3. Sécurité du Stockage (Supabase Storage)

- **Bucket** : `pedagogical-documents` configuré avec `public = false`.
- **Règles de partitionnement** :
  - Documents privés d'un étudiant : chemin `{user_id}/{document_id}.pdf`. Seul l'utilisateur dont l'UID correspond au premier segment de dossier peut lire ou écrire.
  - Documents institutionnels : chemin `institutional/{subject_id}/{document_id}.pdf`. Lecture permise aux utilisateurs authentifiés, écriture bloquée pour les étudiants (réservée à l'administration via service_role).
