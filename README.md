# MonParcours — Plateforme d'apprentissage personnalisée (FASEG)

> **Milestone 02 — Architecture académique, Profil & Onboarding étudiant**

MonParcours est un SaaS EdTech conçu pour offrir un environnement d'apprentissage personnalisé aux étudiants universitaires. Son premier déploiement pilote cible la **Faculté des Sciences Économiques et de Gestion (FASEG)** de l'**Université de Lomé**.

---

## 1. Stack Technique

* **Framework Frontend / Backend** : [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions & `proxy.ts`)
* **Langage** : [TypeScript](https://www.typescriptlang.org/) (mode `strict: true`)
* **Styling & Design System** : [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
* **Base de données & Auth** : [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`, PostgreSQL RLS)
* **Stockage sécurisé** : Supabase Storage (bucket privé `pedagogical-documents`)
* **Validation des données** : [Zod](https://zod.dev/)
* **Architecture IA** : Services serveur contextualisés (`AcademicContext`, sans appel direct côté client, aucun LLM en M02)

---

## 2. Documentation Détaillée

* [Documentation du Modèle de Données](docs/database.md) : Dictionnaire des tables, relations, contraintes et index.
* [Politique de Sécurité & RLS](docs/security.md) : Matrice complète des règles Row Level Security et isolation des données.

---

## 3. Installation et Lancement Local

### Étape 1 : Cloner le dépôt et entrer dans le dossier
```bash
cd CampusIA
```

### Étape 2 : Installer les dépendances
```bash
npm.cmd install
# ou sur Linux/macOS :
npm install
```

### Étape 3 : Configurer les variables d'environnement
Dupliquez le fichier `.env.example` en `.env.local` :
```bash
copy .env.example .env.local
# ou sur Linux/macOS :
cp .env.example .env.local
```

Renseignez vos clés Supabase dans `.env.local`.

### Étape 4 : Appliquer les migrations et le seed Supabase
Les scripts SQL sont versionnés et idempotents :
1. **Migration structurelle** : Exécuter le fichier [20260918000001_milestone02_academic_model.sql](supabase/migrations/20260918000001_milestone02_academic_model.sql).
2. **Seed initial** : Exécuter [seed.sql](supabase/seed.sql) pour charger l'Université de Lomé, la FASEG et les semestres S1/S2.

### Étape 5 : Démarrer le serveur de développement
```bash
npm.cmd run dev
# ou :
npm run dev
```
L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## 4. Tests et Vérification de Qualité

```bash
# 1. Vérification stricte des types TypeScript
npm.cmd run typecheck

# 2. Analyse statique ESLint
npm.cmd run lint

# 3. Compilation et build de production Next.js
npm.cmd run build

# 4. Tests d'isolation RLS (SQL)
# Exécuter les scripts de test dans supabase/tests/ sur votre instance de test :
# - 01_student_profiles_rls.sql
# - 02_student_subject_progress_rls.sql
# - 03_academic_catalog_rls.sql
# - 04_pedagogical_documents_rls.sql
# - 05_storage_rls.sql
```

---

## 5. Structure de l'Architecture

```text
CampusIA/
├── docs/
│   ├── database.md              # Documentation du schéma et dictionnaire des tables
│   └── security.md              # Matrice RLS et règles de sécurité
├── scripts/
│   └── test-rls.ts              # Script TypeScript de validation d'isolation RLS
├── supabase/
│   ├── migrations/              # Migrations SQL versionnées
│   │   └── 20260918000001_milestone02_academic_model.sql
│   ├── tests/                   # Suites de tests SQL d'isolation RLS
│   │   ├── 01_student_profiles_rls.sql
│   │   ├── 02_student_subject_progress_rls.sql
│   │   ├── 03_academic_catalog_rls.sql
│   │   ├── 04_pedagogical_documents_rls.sql
│   │   └── 05_storage_rls.sql
│   └── seed.sql                 # Données de référence confirmées (UL / FASEG)
└── src/
    ├── proxy.ts                 # Handler proxy Next.js 16 (sessions SSR & redirections)
    ├── app/                     # Next.js App Router
    │   ├── auth/                # Authentification (login, register, callback, actions)
    │   ├── onboarding/          # Flux d'onboarding étudiant pas-à-pas et idempotent
    │   ├── dashboard/           # Tableau de bord étudiant & progression par matière
    │   ├── layout.tsx           # Shell principal
    │   └── page.tsx             # Page d'accueil
    ├── components/
    │   ├── layout/              # Header, Footer, Container
    │   └── ui/                  # Button, Card, Input, Badge
    ├── config/
    │   └── env.ts               # Validation Zod des variables d'environnement
    ├── lib/
    │   ├── academic/
    │   │   └── context.ts       # getStudentAcademicContext() -> DTO AcademicContext
    │   └── supabase/            # Clients client, server, admin et middleware
    └── types/
        ├── academic.ts          # Types du catalogue, schémas Zod et DTO IA
        ├── ai.ts                # Contrats IA minimaux
        └── index.ts             # Index unifié des types
```

---

## 6. Sécurité et Bonnes Pratiques

1. **Isolation stricte des projets Supabase** : MonParcours requiert une instance Supabase dédiée sans partage de schéma.
2. **Étanchéité des données étudiantes** : Les profils et suivis d'apprentissage sont protégés par RLS avec `auth.uid() = user_id`.
3. **Idempotence de l'onboarding** : Les actions d'enregistrement utilisent `ON CONFLICT` pour éliminer tout risque de doublon.
4. **Documents privés scellés** : Bucket `pedagogical-documents` privé (`public: false`), chemins cloisonnés par identifiant utilisateur.
