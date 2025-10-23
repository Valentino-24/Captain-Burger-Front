import type { IUser } from "../types/IUser";
import { navigate } from "./navigate";

export const saveUser = (userData: IUser) => {
  const parse = JSON.stringify(userData);
  localStorage.setItem("userData", parse);
};

export const logoutUser = () => {
  localStorage.removeItem("userData");
  navigate("/src/pages/auth/login/login.html");
};
