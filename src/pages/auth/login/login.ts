import type { IUser } from "../../../types/IUser";
import { inicioSesion } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

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
  nombre:"",
  email,
  password
  };

inicioSesion(user);

let storedUser = localStorage.getItem('userData');

user.rol = storedUser ? JSON.parse(storedUser).rol : null;

alert(user.rol);
if (user.rol == "ADMIN") {
    navigate("/src/pages/admin/home/home.html");
  } else if (user.rol == "USUARIO") {
    navigate("/src/pages/client/home/home.html");
  }
});