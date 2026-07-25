export type Rol = "ADMIN" | "TRABAJADOR";

/** Matriz de permisos central: agrega aquí cualquier acción nueva del sistema. */
export const PERMISOS = {
  verCostos: ["ADMIN"],
  anularVenta: ["ADMIN"],
  eliminarProducto: ["ADMIN"],
  verReportes: ["ADMIN"],
  gestionarUsuarios: ["ADMIN"],
  editarConfiguracion: ["ADMIN"],
  registrarVenta: ["ADMIN", "TRABAJADOR"],
  editarStock: ["ADMIN", "TRABAJADOR"],
  abrirTurnoPropio: ["ADMIN", "TRABAJADOR"],
} as const;

export function puede(rol: Rol | undefined, accion: keyof typeof PERMISOS): boolean {
  if (!rol) return false;
  return (PERMISOS[accion] as readonly string[]).includes(rol);
}
