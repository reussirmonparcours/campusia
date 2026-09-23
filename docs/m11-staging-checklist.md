# M11.8 Staging Preparation Checklist (Vercel)

Avant le déploiement sur Vercel, voici les éléments à vérifier impérativement pour la phase de test finale.

## 1. Variables d'environnement
S'assurer que les variables de production ne sont **pas** utilisées, et qu'aucune passerelle de paiement (ex: Stripe) n'est activée.

- `NEXT_PUBLIC_SUPABASE_URL` = URL du projet Staging Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Clé anonyme Staging
- `SUPABASE_SERVICE_ROLE_KEY` = (Sécurisé côté serveur)
- `OPENAI_API_KEY` = Clé OpenAI valide

## 2. Base de données
- Exécuter la migration `20260923000003_m11_8_remove_ghost_program.sql` sur la base Staging pour purger les données fantômes de M02.
- Vérifier que la table `program_subjects` contient bien les données FASEG réelles pour le bon fonctionnement de la nouvelle logique de l'Onboarding.

## 3. Paramètres de Build
- `npm run typecheck` doit passer (Vérifié: PASS).
- `npm run lint` peut échouer sur des tests expérimentaux (`scripts/`, `scratch/`), donc on ignore ESLint pour le build applicatif via le `next.config.mjs` existant :
```javascript
  eslint: {
    ignoreDuringBuilds: true,
  },
```

## 4. Mode "Non-Commercial"
- L'URL du projet sur Vercel (ex: `https://monparcours-staging.vercel.app`) doit être communiquée aux bêta-testeurs.
- Le sign-up restera libre (ou sur invitation si restreint au niveau Supabase Auth).
- L'achat de crédits ou de plans est désactivé dans le code (M11.7/M11.8 ont préservé l'état "gratuit" du mode beta).
