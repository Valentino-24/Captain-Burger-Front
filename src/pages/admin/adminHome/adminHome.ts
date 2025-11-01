import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";

const buttonLogout = document.getElementById(
    "button_logout"
) as HTMLButtonElement;

buttonLogout.addEventListener("click", () => {
    logoutUser();
});

const initPage = () => {
  checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
};

initPage();

