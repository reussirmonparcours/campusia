import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function DesignSystemPage() {
  return (
    <Container className="py-12 space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy-950 mb-2">Design System — Phase 2</h1>
        <p className="text-text-secondary">Validation visuelle des tokens, primitives et du Brand UI Kit.</p>
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">0. Brand Logo</h2>
        <div className="flex gap-8 items-center bg-surface-muted p-6 rounded-xl border border-border-default">
          <BrandLogo />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">1. Couleurs (Brand & Semantic)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-navy-900 text-white">
            <CardHeader><CardTitle className="text-white">Navy Primary</CardTitle></CardHeader>
            <CardContent>bg-navy-900</CardContent>
          </Card>
          <Card className="bg-gold-500 text-navy-950">
            <CardHeader><CardTitle className="text-navy-950">Gold Accent</CardTitle></CardHeader>
            <CardContent>bg-gold-500</CardContent>
          </Card>
          <Card className="bg-success-bg border-success-base">
            <CardHeader><CardTitle className="text-success-text">Success</CardTitle></CardHeader>
          </Card>
          <Card className="bg-error-bg border-error-base">
            <CardHeader><CardTitle className="text-error-text">Error</CardTitle></CardHeader>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">2. Boutons & Intéractions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary (Navy)</Button>
          <Button variant="accent">Accent (Gold)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">3. Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="accent">Accent Gold</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">4. Formulaires</h2>
        <div className="max-w-sm space-y-4">
          <Input label="Email standard" placeholder="Entrez votre email" helperText="Texte d'aide subtil" />
          <Input label="Email en erreur" placeholder="Entrez votre email" error="Adresse email invalide" />
          <Input label="Champ désactivé" disabled placeholder="Non modifiable" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-border-default pb-2">5. Cards & Élévation</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Carte Standard</CardTitle>
              <CardDescription>Avec ombre subtile par défaut</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Le radius et les bordures utilisent les tokens.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </Container>
  );
}
