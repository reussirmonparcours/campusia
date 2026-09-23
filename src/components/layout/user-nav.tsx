import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/auth/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserNav({ user, className }: { user?: any; className?: string }) {
  if (!user) return null;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        aria-label="Profil utilisateur"
        title={user.email || "Mon profil"}
      >
        <div className="h-8 w-8 bg-navy-50 rounded-full flex items-center justify-center border border-navy-100 text-navy-700">
          <User className="h-4 w-4" aria-hidden="true" />
        </div>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="p-1.5 text-text-muted hover:text-navy-900 transition-colors rounded-lg hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          title="Se déconnecter"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
