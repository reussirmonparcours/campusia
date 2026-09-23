# MonParcours - M07 Phase 1: Design Tokens & Visual Foundations

## 1. Couleurs (Colors)

### 1.1 Brand Colors
- **Navy (Base Institutionnelle)** : Variables `--color-navy-50` à `--color-navy-950`.
- **Gold (Couleur d'Accent)** : Variables `--color-gold-50` à `--color-gold-950`.

### 1.2 Semantic Colors
- **Success** : `--color-success-base`, `--color-success-bg`, `--color-success-text` (Basé sur Emerald)
- **Warning** : `--color-warning-base`, `--color-warning-bg`, `--color-warning-text` (Basé sur Amber)
- **Error** : `--color-error-base`, `--color-error-bg`, `--color-error-text` (Basé sur Rose)
- **Info** : `--color-info-base`, `--color-info-bg`, `--color-info-text` (Basé sur Blue)

### 1.3 Backgrounds & Surfaces
- **Background** : `--color-bg-base` (`#f8fafc` - Slate 50)
- **Surface Base** : `--color-surface-base` (`#ffffff`)
- **Surface Elevated** : `--color-surface-elevated` (`#ffffff`)
- **Surface Muted** : `--color-surface-muted` (`#f1f5f9` - Slate 100)

### 1.4 Text & Borders
- **Text Primary** : `--color-text-primary` (`#0f172a` - Slate 900)
- **Text Secondary** : `--color-text-secondary` (`#64748b` - Slate 500)
- **Text Muted** : `--color-text-muted` (`#94a3b8` - Slate 400)
- **Text Inverse** : `--color-text-inverse` (`#ffffff`)
- **Border Default** : `--color-border-default` (`#e2e8f0` - Slate 200)
- **Border Subtle** : `--color-border-subtle` (`#f1f5f9` - Slate 100)
- **Border Focus** : `--color-border-focus` (`var(--color-navy-500)`)

## 2. Typographie (Typography)
- La police est pilotée par le thème de base de l'application (Geist Sans par défaut).
- L'échelle suit les tailles par défaut de Tailwind CSS pour la lisibilité sur mobile et desktop.

## 3. Radius
- `--radius-sm`: `0.25rem`
- `--radius-md`: `0.5rem`
- `--radius-lg`: `0.75rem`
- `--radius-xl`: `1rem`
- `--radius-pill`: `9999px`

## 4. Shadows (Ombres)
- `--shadow-subtle`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Ombre légère pour les cartes de base).
- `--shadow-medium`: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)` (Hover).
- `--shadow-strong`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)` (Modales).

## 5. Motion System
- `--animate-duration-fast`: `150ms`
- `--animate-duration-normal`: `250ms`

## 6. Primitives Mises à Jour
- **Button** : Intègre les variantes `primary` (navy), `accent` (gold), `secondary`, `outline`, et `ghost`.
- **Input** : Border focus en navy, support pour l'état d'erreur en rose, respect du layout mobile-first.
- **Card** : Applique `--shadow-subtle` par défaut, et `--shadow-medium` au survol avec `--animate-duration-normal`.
- **Badge** : Utilise les couleurs sémantiques et offre les variantes brand (`accent`, `neutral`).
