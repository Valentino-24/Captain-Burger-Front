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
  if (!parseUser.loggedIn || parseUser.role !== rol) {
    navigate(route);
    return;
  }
};
