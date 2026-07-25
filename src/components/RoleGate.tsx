"use client";

import { useSession } from "next-auth/react";

/** Oculta contenido si el rol de la sesión no está en `allow`. */
export default function RoleGate({ allow, children }: { allow: string[]; children: React.ReactNode }) {
  const { data: session } = useSession();
  const rol = (session?.user as any)?.rol;
  if (!rol || !allow.includes(rol)) return null;
  return <>{children}</>;
}
