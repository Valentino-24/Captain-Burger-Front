import type { IUser } from "../../../types/IUser";
import { inicioSesion, logoutUser } from "../../../utils/localStorage";

//logoutUser(); // Asegura que el usuario esté deslogueado al cargar la página

const loginForm = document.getElementById("form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

loginForm.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    alert("NO estan todos los datos");
    return;
  }

  const user: IUser = {
  nombre: "",
  email,
  password
  };

inicioSesion(user);
});