import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";

const buttonLogout = document.getElementById(
    "button_logout"
) as HTMLButtonElement;

buttonLogout.addEventListener("click", () => {
    logoutUser();
});

const initPage = () => {
<<<<<<< HEAD:src/pages/admin/home/home.ts
  checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
};

initPage();

=======
    checkAuthUser("admin", "/src/pages/auth/login/login.html");
};
>>>>>>> d3f55cf65bb8bafbfa00ec86f056572b8cda6d80:src/pages/admin/adminHome/adminHome.ts
