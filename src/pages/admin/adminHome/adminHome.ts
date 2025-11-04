import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";

const buttonLogout = document.getElementById(
    "button_logout"
) as HTMLButtonElement;

buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

const initPage = () => {
  checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
};

initPage();

