import type { IUser } from "../types/IUser";
import type { Rol } from "../types/Rol";
import { navigate } from "./navigate";

// Verificar si el usuario autenticado tiene el rol adecuado

export const checkAuthUser = (rol: Rol, route: string) => {
  const user = localStorage.getItem("userData");
  if (!user) {
    alert("No autenticado");
    navigate(route);
    return;
  }
  const parseUser: IUser = JSON.parse(user);
  if (parseUser.rol !== rol) {
    alert("No autorizado");
    navigate(route);
    return;
  }
};

// Obtener el usuario actualmente logueado

export const getCurrentUser = (): IUser | null => {
  const user = localStorage.getItem("userData");
  if (!user) {
    return null;
  }
  try {
    return JSON.parse(user) as IUser;
  } catch (error) {
    console.error("Error al parsear userData:", error);
    return null;
  }
};

// Verificar si el usuario está autenticado

export const isAuthenticated = (): boolean => {
  return localStorage.getItem("userData") !== null;
};