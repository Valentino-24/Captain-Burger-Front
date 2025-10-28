import type { IUser } from "../types/IUser";
import type { Rol } from "../types/Rol";
import { navigate } from "./navigate";

export const checkAuthUser = (rol: Rol, route: string) => {
  const user = localStorage.getItem("userData");
  
  if (!user) {
    navigate(route);
    return;
  }
  const parseUser: IUser = JSON.parse(user);
  alert(user);
  if (parseUser.rol !== rol) {
    navigate(route);
    return;
  }
};