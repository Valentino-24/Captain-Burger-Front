import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/auth/login/login.html"),
        register: resolve(__dirname, "src/pages/auth/register/register.html"),
        
        // STORE (Cliente)
        storeHome: resolve(__dirname, "src/pages/store/home/home.html"),
        productDetail: resolve(__dirname, "src/pages/store/productDetail/productDetail.html"),
        cart: resolve(__dirname, "src/pages/store/cart/cart.html"),
        
        // Cliente - Pedidos
        clientOrders: resolve(__dirname, "src/pages/client/orders/orders.html"),
        
        // Admin
        adminHome: resolve(__dirname, "src/pages/admin/adminHome/adminHome.html"),
        categories: resolve(__dirname, "src/pages/admin/categories/categories.html"),
        products: resolve(__dirname, "src/pages/admin/products/products.html"),
        adminOrders: resolve(__dirname, "src/pages/admin/orders/orders.html"),
      },
    },
  },
  base: "./",
});