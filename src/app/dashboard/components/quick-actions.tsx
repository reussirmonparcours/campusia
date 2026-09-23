import Link from "next/link";
import { BookOpen, RotateCcw, GraduationCap, Bot, ArrowUpRight } from "lucide-react";

interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
  iconColor: string;
  iconBg: string;
}

const actions: QuickActionItem[] = [
  {
    title: "Matières",
    description: "Cours & syllabus",
    href: "/dashboard/subjects",
    icon: BookOpen,
    iconColor: "text-navy-700",
    iconBg: "bg-navy-100",
  },
  {
    title: "Réviser",
    description: "Entraînement guidé",
    href: "/dashboard/revision",
    icon: RotateCcw,
    iconColor: "text-amber-700",
    iconBg: "bg-amber-100",
  },
  {
    title: "Examens",
    description: "Simulations notées",
    href: "/dashboard/exams",
    icon: GraduationCap,
    iconColor: "text-navy-800",
    iconBg: "bg-navy-100",
  },
  {
    title: "Tuteur IA",
    description: "Assistant pédagogique",
    href: "/dashboard/ai",
    icon: Bot,
    iconColor: "text-gold-800",
    iconBg: "bg-gold-100",
  },
];

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-3">
      <h2 id="quick-actions-heading" className="text-base font-bold tracking-tight text-navy-950 sm:text-lg">
        Accès rapides
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex items-center gap-3 rounded-xl border border-border-default bg-surface-base p-3.5 sm:p-4 text-left shadow-subtle transition-all duration-fast hover:border-navy-300 hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 min-h-[56px]"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg} ${action.iconColor} transition-transform group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy-950 group-hover:text-navy-700 truncate">
                    {action.title}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
