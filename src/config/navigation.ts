import { Home, BookOpen, Layers, Target, Sparkles, GraduationCap } from "lucide-react";

export const mainNavigation = [
  { title: "Accueil", href: "/dashboard", icon: Home },
  { title: "Matières", href: "/dashboard/subjects", icon: BookOpen },
  { title: "Réviser", href: "/dashboard/revision", icon: Layers },
  { title: "Examens", href: "/dashboard/exams", icon: GraduationCap },
  { title: "Progression", href: "/dashboard/objectives", icon: Target },
  { title: "Coach IA", href: "/dashboard/ai", icon: Sparkles },
];

