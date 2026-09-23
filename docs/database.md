# Modèle de Données & Schéma Relationnel — MonParcours

Ce document décrit l'architecture des données mise en place pour le **Milestone 02** de MonParcours, ciblant l'Université de Lomé et la FASEG.

---

## 1. Vue d'Ensemble & Principes Directeurs

- **Séparation claire** : Distinction nette entre le catalogue académique institutionnel (lecture seule pour les étudiants) et les données personnelles (profil, progression, documents privés).
- **Mode Ouvert (Open Mode)** : L'architecture découplée permet aux étudiants de s'inscrire et d'utiliser MonParcours même si leur université ne dispose pas d'un catalogue officiel complet.
- **Souplesse MVP** : Modélisation `Programme → Semestre → Matière` qui gère nativement les années de Tronc Commun et de Spécialisation sans imposer artificiellement les Unités d'Enseignement (UE).
- **Structurel vs Temporel** : Les semestres (S1 à S6) sont des entités structurelles rattachées au programme, évitant toute duplication redondante par année civile ou spécialité.
- **Idempotence native** : Contraintes d'unicité protégeant contre les doublons lors des inscriptions et mises à jour.

---

## 2. Dictionnaire des Tables

### 2.1 Catalogue Académique (Public Schema)

#### `institutions`
Établissements d'enseignement supérieur ou de formation.
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `type` (TEXT, CHECK `IN ('university', 'school', 'institute', 'training_center', 'other')`)
- `code` (TEXT, UNIQUE, NOT NULL) — ex: `'UL'`
- `country` (TEXT, NOT NULL) — ex: `'Togo'`
- `created_at` (TIMESTAMPTZ)

#### `academic_units`
Composantes de l'institution (Facultés, Écoles, Instituts, Départements).
- `id` (UUID, PK)
- `institution_id` (UUID, FK -> `institutions.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `type` (TEXT, CHECK `IN ('faculty', 'school', 'institute', 'department', 'other')`)
- `code` (TEXT, UNIQUE, NOT NULL) — ex: `'FASEG'`
- `created_at` (TIMESTAMPTZ)

#### `programs`
Filières ou mentions disciplinaires.
- `id` (UUID, PK)
- `academic_unit_id` (UUID, FK -> `academic_units.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL) — ex: `'Sciences Économiques et de Gestion'`
- `cycle` (TEXT, CHECK `cycle IN ('Licence', 'Master', 'Doctorat', 'Bachelor', 'Other')`)
- `created_at` (TIMESTAMPTZ)

#### `tracks`
Parcours de spécialité ou troncs communs.
- `id` (UUID, PK)
- `program_id` (UUID, FK -> `programs.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL) — ex: `'Tronc Commun FASEG'`
- `code` (TEXT, UNIQUE, NULLABLE)
- `created_at` (TIMESTAMPTZ)

#### `semesters`
Semestres structurels du programme (S1 à S6 en Licence).
- `id` (UUID, PK)
- `program_id` (UUID, FK -> `programs.id` ON DELETE CASCADE)
- `semester_number` (INTEGER, NOT NULL, CHECK `1 <= semester_number <= 6`)
- `total_credits` (INTEGER, NULLABLE, CHECK `> 0 AND <= 60`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- **Contrainte** : `UNIQUE (program_id, semester_number)`

#### `subjects`
Matières d'enseignement (ECUE) officielles ou personnalisées.
- `id` (UUID, PK)
- `code` (TEXT, NULLABLE) — ex: `'ECO101'`
- `name` (TEXT, NOT NULL)
- `description` (TEXT, NULLABLE)
- `credits` (INTEGER, NULLABLE, CHECK `credits > 0`)
- `created_by` (UUID, NULLABLE, FK -> `auth.users.id` ON DELETE CASCADE) — NULL pour le catalogue officiel, Renseigné pour les matières privées de l'étudiant.
- `created_at` (TIMESTAMPTZ)
- **Contrainte** : Index partiel unique sur `code` où `created_by IS NULL`.

#### `program_subjects`
Association N:M entre un semestre de programme, une matière, et éventuellement une spécialité (track).
- `id` (UUID, PK)
- `semester_id` (UUID, FK -> `semesters.id` ON DELETE CASCADE)
- `subject_id` (UUID, FK -> `subjects.id` ON DELETE CASCADE)
- `track_id` (UUID, NULLABLE, FK -> `tracks.id` ON DELETE CASCADE) — Si NULL, c'est le tronc commun.
- `display_order` (INTEGER, NULLABLE)
- `is_required` (BOOLEAN, DEFAULT true)
- `created_at` (TIMESTAMPTZ)
- **Contrainte** : Deux index partiels uniques remplacent la contrainte UNIQUE pour gérer correctement `NULL` :
  - `UNIQUE (semester_id, subject_id, track_id) WHERE track_id IS NOT NULL`
  - `UNIQUE (semester_id, subject_id) WHERE track_id IS NULL`

---

### 2.2 Données Étudiantes & Apprentissage

#### `student_profiles`
Profil de l'étudiant connecté.
- `user_id` (UUID, PK, FK -> `auth.users.id` ON DELETE CASCADE)
- `first_name` (TEXT, NOT NULL)
- `last_name` (TEXT, NOT NULL)
- `display_name` (TEXT, NULLABLE)
- `program_id` (UUID, FK -> `programs.id` ON DELETE SET NULL)
- `current_track_id` (UUID, FK -> `tracks.id` ON DELETE SET NULL)
- `current_semester_id` (UUID, FK -> `semesters.id` ON DELETE SET NULL)
- `custom_institution` (TEXT, NULLABLE) — Nom de l'établissement en Mode Ouvert.
- `custom_program` (TEXT, NULLABLE) — Nom de la formation en Mode Ouvert.
- `custom_level` (TEXT, NULLABLE) — Niveau actuel en Mode Ouvert.
- `registration_year` (TEXT, NULLABLE) — ex: `'2024-2025'`
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `student_subject_progress`
État d'apprentissage personnel par matière.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `auth.users.id` ON DELETE CASCADE)
- `subject_id` (UUID, FK -> `subjects.id` ON DELETE CASCADE)
- `learning_status` (TEXT, CHECK `IN ('en_cours', 'a_reviser', 'comprise', 'maitrisee')`)
- `is_flagged_difficult` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- **Contrainte** : `UNIQUE (user_id, subject_id)`

#### `pedagogical_documents`
Métadonnées des supports pédagogiques.
- `id` (UUID, PK)
- `subject_id` (UUID, FK -> `subjects.id` ON DELETE SET NULL)
- `uploader_id` (UUID, NULLABLE, FK -> `auth.users.id` ON DELETE SET NULL)
- `title` (TEXT, NOT NULL)
- `storage_path` (TEXT, NOT NULL)
- `doc_type` (TEXT, CHECK `IN ('cours', 'td', 'annale', 'synthese', 'autre')`)
- `is_official` (BOOLEAN, DEFAULT false)
- `visibility` (TEXT, CHECK `IN ('private', 'institutional')`)
- `processing_status` (TEXT, DEFAULT `'pending'`, CHECK `IN ('pending', 'processing', 'processed', 'failed')`)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- **Contrainte** :
  `CHECK ((is_official = false AND visibility = 'private' AND uploader_id IS NOT NULL) OR (is_official = true AND visibility = 'institutional'))`
