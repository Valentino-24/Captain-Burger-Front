import type { IUser } from "../types/IUser";
import { navigate } from "./navigate";
import { crearUsuario, loginUsuario } from "./api";
import { checkAuthUser } from "./auth";

export const saveUser = (userData: IUser) => {

  crearUsuario(userData)
    .then((data) => {

      console.log('✅ Usuario guardado en backend:', data);
      localStorage.setItem('userData', JSON.stringify(data)); // guardás el que vuelve del backend
    })
    .catch((err) => {
      console.error('❌ Error al guardar usuario:', err);
    });
};

export const inicioSesion = (userData: IUser) => {
  loginUsuario(userData.email, userData.password)
    .then((data) => {
      localStorage.setItem('userData', JSON.stringify(data));
      checkAuthUser("USUARIO", "/src/pages/client/home/home.html");
    })
    .catch((err) => {
      console.error('❌ Error al iniciar sesión:', err);
    });
};



export const logoutUser = () => {
  localStorage.removeItem("userData");
  navigate("/src/pages/auth/login/login.html");
};