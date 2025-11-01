import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/auth/login/login.html"),
        adminHome: resolve(__dirname, "src/pages/admin/home/home.html"),
        clientHome: resolve(__dirname, "src/pages/client/home/home.html"),
        categories: resolve(__dirname, "src/pages/admin/categories/categories.html"),
        products: resolve(__dirname, "src/pages/admin/products/products.html"),
      },
    },
  },
  base: "./",
});
