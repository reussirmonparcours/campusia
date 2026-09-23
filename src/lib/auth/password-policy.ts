import { z } from "zod";

/**
 * Politiques de sécurité des mots de passe MonParcours (M07)
 * Source unique de vérité pour l'UI, la checklist et la validation serveur.
 */

export interface PasswordRuleState {
  id: string;
  label: string;
  isMet: boolean;
  hint?: string;
}

export interface PasswordEvaluation {
  rules: PasswordRuleState[];
  isValid: boolean;
  score: number;
}

export const PASSWORD_RULES = {
  minLength: {
    id: "minLength",
    label: "8 caractères minimum",
    test: (val: string) => val.length >= 8,
  },
  uppercase: {
    id: "uppercase",
    label: "1 majuscule",
    test: (val: string) => /[A-Z]/.test(val),
  },
  lowercase: {
    id: "lowercase",
    label: "1 minuscule",
    test: (val: string) => /[a-z]/.test(val),
  },
  number: {
    id: "number",
    label: "1 chiffre",
    test: (val: string) => /[0-9]/.test(val),
  },
  special: {
    id: "special",
    label: "1 caractère spécial",
    hint: "Ex. @, !, #, _, -",
    test: (val: string) => /[^a-zA-Z0-9]/.test(val),
  },
} as const;

export function evaluatePassword(password: string): PasswordEvaluation {
  const rules: PasswordRuleState[] = [
    {
      id: PASSWORD_RULES.minLength.id,
      label: PASSWORD_RULES.minLength.label,
      isMet: PASSWORD_RULES.minLength.test(password),
    },
    {
      id: PASSWORD_RULES.uppercase.id,
      label: PASSWORD_RULES.uppercase.label,
      isMet: PASSWORD_RULES.uppercase.test(password),
    },
    {
      id: PASSWORD_RULES.lowercase.id,
      label: PASSWORD_RULES.lowercase.label,
      isMet: PASSWORD_RULES.lowercase.test(password),
    },
    {
      id: PASSWORD_RULES.number.id,
      label: PASSWORD_RULES.number.label,
      isMet: PASSWORD_RULES.number.test(password),
    },
    {
      id: PASSWORD_RULES.special.id,
      label: PASSWORD_RULES.special.label,
      hint: PASSWORD_RULES.special.hint,
      isMet: PASSWORD_RULES.special.test(password),
    },
  ];

  const isValid = rules.every((r) => r.isMet);
  const score = rules.filter((r) => r.isMet).length;

  return { rules, isValid, score };
}

// Schémas de validation serveur Zod réutilisables

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit comporter au moins 8 caractères")
  .refine(PASSWORD_RULES.uppercase.test, "Le mot de passe doit contenir au moins 1 majuscule")
  .refine(PASSWORD_RULES.lowercase.test, "Le mot de passe doit contenir au moins 1 minuscule")
  .refine(PASSWORD_RULES.number.test, "Le mot de passe doit contenir au moins 1 chiffre")
  .refine(PASSWORD_RULES.special.test, "Le mot de passe doit contenir au moins 1 caractère spécial");

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Veuillez saisir une adresse email valide"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Veuillez saisir une adresse email valide"),
  password: z.string().min(1, "Veuillez saisir votre mot de passe"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Veuillez saisir une adresse email valide"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
