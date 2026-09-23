"use client";

import * as React from "react";
import { Container } from "@/components/layout/container";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "MonParcours est-il réservé à une seule université ?",
    answer:
      "Non. Même si notre catalogue de lancement a été étalonné avec les unités d'enseignement de l'Université de Lomé (notamment la FASEG), MonParcours est conçu pour s'adapter à la structure modulaire de n'importe quel cursus universitaire.",
  },
  {
    question: "Puis-je utiliser mes propres cours ?",
    answer:
      "Oui. Vous pouvez structurer vos matières, créer vos propres sessions de révision et poser des questions ciblées sur vos notions de cours pour obtenir une assistance pédagogique adaptée.",
  },
  {
    question: "Quel est le rôle de l'IA ?",
    answer:
      "L'IA agit comme un tuteur pédagogique ancré dans votre programme d'études. Elle clarifie les notions complexes, analyse les erreurs que vous commettez lors des exercices et vous aide à orienter vos efforts de révision sans faire le travail à votre place.",
  },
  {
    question: "Puis-je suivre ma progression ?",
    answer:
      "Absolument. Votre espace comprend un tableau de bord indiquant les notions déjà maîtrisées, les chapitres à revoir et les prochaines séances recommandées pour ancrer vos apprentissages dans la durée.",
  },
  {
    question: "Puis-je utiliser MonParcours sur mobile ?",
    answer:
      "Oui. MonParcours est entièrement conçu selon une approche mobile-first. Vous pouvez réviser vos fiches, lancer un entraînement rapide ou consulter votre progression depuis n'importe quel smartphone ou tablette.",
  },
  {
    question: "Comment commencer ?",
    answer:
      "L'inscription est immédiate. Créez votre compte en quelques secondes, renseignez votre formation universitaire, puis accédez directement à votre premier module d'apprentissage.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="py-16 md:py-24">
      <Container size="md" className="space-y-12">
        {/* Section Heading */}
        <div className="text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-600">
            Foire aux questions
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">
            Questions fréquentes
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Tout ce qu&apos;il faut savoir pour démarrer sereinement sur MonParcours.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-content-${index}`;
            const headerId = `faq-header-${index}`;

            return (
              <div
                key={faq.question}
                className="rounded-xl border border-border-default bg-white transition-colors duration-fast hover:border-navy-200 shadow-subtle overflow-hidden"
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                >
                  <span className="text-sm sm:text-base font-semibold text-navy-950">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-navy-700 transition-transform duration-normal",
                      isOpen && "rotate-180 bg-navy-50 text-navy-900"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-border-subtle bg-slate-50/50 px-5 pb-5 pt-3 sm:px-6 sm:pb-6"
                  >
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
