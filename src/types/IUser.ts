import type { Rol } from "./Rol";

export interface IUser {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  rol?: Rol;
}