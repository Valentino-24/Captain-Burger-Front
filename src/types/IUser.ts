import type { Rol } from "./Rol";

export interface IUser {
  id: number;           // ✅ Agregado
  nombre: string;
  email: string;
  password?: string;    // ✅ Cambiado a opcional (no siempre viene en las respuestas)
  rol?: Rol;
}