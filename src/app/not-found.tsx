import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="py-20">
      <Container size="sm">
        <Card>
          <CardHeader>
            <CardTitle>Page introuvable (404)</CardTitle>
            <CardDescription>
              La page ou la ressource demandée n&apos;existe pas ou a été déplacée.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button variant="primary">Retour à l&apos;accueil</Button>
            </Link>
          </CardFooter>
        </Card>
      </Container>
    </main>
  );
}
