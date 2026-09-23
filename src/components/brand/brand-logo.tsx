import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link 
      href="/" 
      aria-label="Accueil MonParcours" 
      className={cn(
        "flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 rounded-md", 
        className
      )}
    >
      <div className="relative transition-opacity duration-normal group-hover:opacity-80">
        <Image 
          src="/brand/logo.png" 
          alt="MonParcours" 
          width={1774}
          height={887}
          className="object-contain object-left h-10 w-auto sm:h-12 md:h-14" 
          priority
        />
      </div>
    </Link>
  );
}
