import * as React from "react";
import Link from "next/link";
import { Container } from "./container";
import { BrandLogo } from "@/components/brand/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-white py-12 md:py-16 text-text-secondary mt-auto">
      <Container size="xl" className="space-y-10">
        {/* Top Grid */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column (Spans 2 cols on lg) */}
          <div className="space-y-4 sm:col-span-2">
            <BrandLogo />
            <p className="text-xs sm:text-sm text-text-secondary max-w-sm leading-relaxed">
              Environnement d&apos;apprentissage universitaire intelligent. Structurez vos matières, consolidez vos acquis et progressez avec méthode tout au long de votre cursus.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center rounded-md bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-800">
                Université de Lomé • FASEG
              </span>
            </div>
          </div>

          {/* Navigation Produit */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-950">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/#produit" className="hover:text-navy-950 transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/#methode" className="hover:text-navy-950 transition-colors">
                  Méthode en 3 étapes
                </Link>
              </li>
              <li>
                <Link href="/#ia" className="hover:text-navy-950 transition-colors">
                  Accompagnement IA
                </Link>
              </li>
              <li>
                <Link href="/#progression" className="hover:text-navy-950 transition-colors">
                  Suivi de progression
                </Link>
              </li>
              <li>
                <Link href="/#tarifs" className="hover:text-navy-950 transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-navy-950 transition-colors">
                  Questions fréquentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Espace Étudiant */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-950">
              Espace Étudiant
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/auth/login" className="hover:text-navy-950 transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-navy-950 transition-colors">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-navy-950 transition-colors">
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>

          {/* Cadre & Sécurité */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-950">
              Cadre &amp; Sécurité
            </h4>
            <div className="space-y-2 text-xs text-text-muted leading-relaxed">
              <p>
                Espace personnel sécurisé. Vos données d&apos;apprentissage et vos résultats d&apos;exercices restent strictement confidentiels.
              </p>
              <p className="text-[11px]">
                Référentiels pédagogiques officiels distincts de vos productions personnelles.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>
            &copy; {new Date().getFullYear()} MonParcours. Tous droits réservés.
          </p>
          <p className="font-mono text-[11px]">
            Conçu pour la réussite universitaire
          </p>
        </div>
      </Container>
    </footer>
  );
}
