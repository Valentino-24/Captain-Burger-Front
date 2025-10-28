import type { IUser } from "../../../types/IUser";
import { saveUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

const loginForm = document.getElementById("form") as HTMLFormElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;
const nameInput = document.getElementById("name") as HTMLInputElement;

loginForm.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();
  const nombre = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password || !nombre) {
    alert("NO estan todos los datos");
    return;
  }

  //harian consulta a la api (caso real)
  // verificarian el usuario
  //caso practico
  const user: IUser = {
    nombre,
    email,
    password
  };

  saveUser(user);

  if (user.rol == "ADMIN") {
    navigate("/src/pages/admin/home/home.html");
  } else if (user.rol == "USUARIO") {
    navigate("/src/pages/client/home/home.html");
  }
});

export {};