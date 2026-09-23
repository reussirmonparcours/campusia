# MonParcours - M07 Phase 0: Product UX Audit

## A. FRONTEND INVENTORY

### Routes
**Publiques :**
- `/` (Landing Page actuelle : aperçu technique)

**Authentifiées :**
- `/auth/login` (Connexion)
- `/auth/register` (Création de compte)
- `/auth/callback` (Callback Supabase)
- `/onboarding` (Configuration du contexte académique)
- `/dashboard` (Vue principale)
- `/dashboard/activity` (Activité globale)
- `/dashboard/ai` (Coach IA)
- `/dashboard/learning` (Apprentissage)
- `/dashboard/objectives` (Objectifs)
- `/dashboard/revision` (Révision)
- `/dashboard/subjects` (Matières)

### Layouts
- `src/app/layout.tsx` (Root layout)
- `src/app/dashboard/layout.tsx` (Dashboard layout)

### Composants Principaux
- **UI (`src/components/ui/`)** : `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `sheet.tsx`.
- **Layout (`src/components/layout/`)** : `container.tsx`, `footer.tsx`, `header.tsx`.
- **Dashboard (`src/components/dashboard/`)** : `dashboard-nav.tsx`.
- **Métier (`src/components/revision/` & autres)** : `CoachInteractive.tsx`, `subject-card.tsx`.
- **Fichiers de style** : `src/app/globals.css`.

---

## B. KEEP (À conserver)
- **Logique Métier & Appels Serveur** : Les Server Components, l'intégration de `createClient`, les appels aux requêtes Supabase (`getStudentDashboardData`).
- **Configuration Auth/RLS** : La logique actuelle d'isolation, les middlewares et les callbacks.
- **Séparation Client/Serveur** : Le bon respect du paradigme React Server Components (RSC).
- **Radix UI Primitives** : Poursuivre l'utilisation de Radix pour l'accessibilité des composants interactifs.

---

## C. TRANSFORM (À refondre/modifier)
- **Composants UI (`src/components/ui/`)** : Doivent intégrer le nouveau Design System (Navy/Gold, border-radius, motion design).
- **Layouts (`layout.tsx`)** : Intégration de la nouvelle typographie (Google Fonts modernes type Inter ou Outfit au lieu des polices par défaut) et adaptation de la navigation responsive (Sidebar / Drawer).
- **Dashboard (`/dashboard/page.tsx`)** : Remanier l'interface pour correspondre à la hiérarchie visuelle cible (greeting, contexte, focus, progression) sans aspect SaaS générique. La logique de donnée reste, l'interface change.

---

## D. REBUILD (À reconstruire entièrement)
- **Landing Page (`/page.tsx`)** : À remplacer totalement pour intégrer le funnel complet (Hero, Value Prop, Features, Social Proof).
- **Expérience d'Authentification (`/auth/*`)** : Refonte UX/UI complète (ajout visuel de Google Auth, séparation claire Connexion / Création).
- **Design Tokens (`globals.css`)** : Remplacer l'approche Tailwind actuelle par une architecture `@theme` stricte basée sur les guidelines de marque (Navy / Gold).

---

## E. MISSING (Ce qui manque)
- **Responsive Mobile-First** : Navigation spécifique mobile (Bottom Tab Navigation ou Drawer fluide).
- **Feedback Visuel Avancé** : Skeletons (pour les états de chargement), Toasts (notifications), Empty States illustrés et Error States esthétiques.
- **Micro-interactions (Motion System)** : Hover states, transitions de pages, animations d'apparition fluides respectant `prefers-reduced-motion`.
- **Composants de formulaires avancés** : Selects stylisés, Progress indicators, Alertes contextuelles.

---

## F. UX AUDIT

### Mobile (Priorité 1)
- **Constat actuel** : Interface fonctionnelle, mais les touch targets sont parfois justes. La navigation principale prend trop de place ou n'est pas optimisée (hamburger basique).
- **Cible** : Navigation rapide (bottom tabs ou drawer), pas de débordement horizontal, priorisation du "Focus du Jour" dès l'ouverture. Cartes adaptées à l'écran.

### Tablet (Priorité 2)
- **Constat actuel** : Se comporte souvent comme un grand mobile ou un petit desktop, sans comportement hybride réfléchi.
- **Cible** : Grilles ajustées (2 colonnes), utilisation optimisée de l'espace latéral.

### Desktop (Priorité 3)
- **Constat actuel** : Design très "Dashboard SaaS générique Tailwind". Propre mais manque d'identité.
- **Cible** : Direction visuelle premium. Clarté, grands espacements, typographie soignée. Le bleu navy structure, l'or attire l'œil sur le CTA principal.

### Accessibility (A11y)
- **Constat actuel** : Radix UI apporte une bonne base.
- **Cible** : Vérification systématique des contrastes (notamment l'or sur fond clair ou foncé), focus rings bien visibles (`focus-visible`), aria-labels complets, navigation au clavier parfaite.

### Performance
- **Constat actuel** : Très bon (RSC, peu de JS).
- **Cible** : Maintenir ce standard. Les animations doivent utiliser CSS transforms/opacity pour ne pas impacter le layout. Images optimisées.

---

## H. TARGET INFORMATION ARCHITECTURE

**Parcours Public :**
1. Landing Page
2. Créer un compte -> Vérification Email -> Connexion
3. Ou : Continuer avec Google -> Onboarding

**Parcours Authentifié :**
1. Connexion
2. Onboarding (si non finalisé)
3. Dashboard (Cockpit)

**Navigation Principale Cible :**
- Dashboard
- Matières
- Réviser
- Progression
- IA (Coach)
- *Secondaire* : Profil / Paramètres

---

## I. LANDING PAGE STRUCTURE
- **HEADER** : Logo + Connexion / S'inscrire
- **HERO** : Proposition de valeur claire + CTA primaire
- **VALUE PROPOSITION** : Pourquoi MonParcours ?
- **PRODUCT SHOWCASE** : Aperçu de l'interface premium
- **HOW IT WORKS** : Étapes simples
- **FEATURES** : Apprentissage, IA, Progression
- **TRUST / SECURITY** : Contenu honnête (pré-lancement)
- **SOCIAL PROOF** : Témoignages (réels uniquement, ou cachés si inexistants)
- **FAQ**
- **FINAL CTA**
- **FOOTER**

---

## J. AUTH EXPERIENCE
- **Créer un compte** : Formulaire clair (Email, Mot de passe, Confirmation) + Bouton "Continuer avec Google". Lien "Déjà un compte ?".
- **Connexion** : Email, Mot de passe (avec affichage/masquage), "Mot de passe oublié", "Continuer avec Google". Lien "Pas de compte ?".
- L'expérience doit être fluide, encapsulée dans une belle carte ou layout "split" (image à gauche sur desktop). Aucune configuration Supabase ne doit être modifiée dans cette phase.

---

## K. ONBOARDING
- L'onboarding doit être visuellement rassurant, professionnel et académique.
- Étape par étape, pour collecter l'université, la filière, et le niveau. 
- Utilisation de grandes zones de sélection plutôt que de simples "select" natifs pour une sensation premium.

---

## L. DASHBOARD TARGET
- Doit répondre à : *Où suis-je ? Comment je progresse ? Que dois-je faire ? Comment avoir de l'aide ?*
- **Greeting** : Salutation chaleureuse + Contexte (ex: L1 FASEG).
- **Focus du Jour** : Carte mise en valeur par un subtil accent Or (l'action immédiate).
- **Progression** : Chiffres clés très lisibles (Matières, Maîtrisées, À réviser).
- **Activité Récente** : Timeline claire et aérée.
- Données exclusivement issues de `getStudentDashboardData`.

---

## M. RESPONSIVE STRATEGY
- **Mobile First** : Composants conçus d'abord pour petits écrans. Les interactions clés doivent être sous le pouce.
- **Tablet** : Ajustement des grilles et des `flex-direction`.
- **Desktop** : Élargissement maîtrisé (max-width), marges généreuses, sidebars si nécessaires (ou top navigation très claire).

---

## N. FILES CREATED/MODIFIED
- `docs/m07-product-ux-audit.md` (Créé)
- `docs/m07-design-system.md` (Créé)
- Aucun fichier de code n'a été modifié lors de cette phase.

---

## P. RISKS / QUESTIONS
1. **Google Auth** : L'intégration UI du bouton Google sera faite dans la refonte, mais la configuration backend n'est pas modifiée. Le bouton déclenchera potentiellement une erreur jusqu'à la phase d'implémentation backend (M07+).
2. **Tailwind v4** : Le système utilise Tailwind v4 (avec `@theme inline`). L'intégration du nouveau Design System nécessite d'écrire ces variables proprement dans `globals.css` en respectant la syntaxe v4, qui diffère légèrement de v3 (`tailwind.config.ts`).

---

## Q. RECOMMENDED IMPLEMENTATION ORDER
1. **Design Tokens & Globals** : Implémenter le Design System (Couleurs, Typographie, Spacing) dans `globals.css`.
2. **UI Kit Foundation** : Refondre les atomes UI (`Button`, `Input`, `Card`, `Badge`) pour qu'ils respirent le premium.
3. **Layout & Navigation** : Créer le layout responsive cible (Header / Drawer Mobile).
4. **Auth Flow** : Refondre visuellement l'expérience d'authentification.
5. **Dashboard** : Restructurer le dashboard étudiant avec les nouvelles UI Cards.
6. **Views & Pages** : Refondre les autres vues (Matières, Révisions, Coach).
7. **Landing Page** : Construire la Landing Page cible en dernier pour capitaliser sur les composants UI construits.
