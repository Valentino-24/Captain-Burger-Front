import type { Rol } from "./Rol";

export interface IUser {
  nombre: string;
  email: string;
  password: string;
  rol?: Rol;
}
