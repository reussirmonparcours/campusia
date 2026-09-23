"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: "Fonctionnalités", href: "/#produit" },
    { label: "Méthode", href: "/#methode" },
    { label: "Accompagnement IA", href: "/#ia" },
    { label: "Progression", href: "/#progression" },
    { label: "Tarifs", href: "/#tarifs" },
    { label: "FAQ", href: "/#faq" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-medium text-text-secondary" aria-label="Navigation publique">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors duration-fast hover:text-navy-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-3">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Connexion</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="primary" size="sm">Créer mon compte</Button>
        </Link>
      </div>

      {/* Mobile Toggle & Quick Action */}
      <div className="flex sm:hidden items-center gap-2">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm" className="px-2.5 text-xs">
            Connexion
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-navy-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown / Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 border-b border-border-default bg-surface-base px-4 py-6 shadow-strong animate-in fade-in slide-in-from-top-2 duration-fast">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2 pb-4 border-b border-border-subtle">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-navy-950 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/register" onClick={handleLinkClick} className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Créer mon compte
                </Button>
              </Link>
              <Link href="/auth/login" onClick={handleLinkClick} className="w-full">
                <Button variant="outline" size="md" className="w-full justify-center">
                  Se connecter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
