// src/pages/admin/adminStore/adminStore.ts (o la ruta que uses)
// Versión para Admin: ver productos como el usuario pero SIN poder agregarlos al carrito

import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getCategorias, getProductos } from "../../../utils/api";
import type { ICategoria } from "../../../types/ICategoria";
import type { IProducto } from "../../../types/IProducto";

// DOM
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const listaCategorias = document.getElementById("lista-categorias") as HTMLUListElement | null;
const gridProductos = document.getElementById("grid-productos") as HTMLDivElement;

// Estado
let todosLosProductos: IProducto[] = [];
let categoriaSeleccionada: number | null = null;

// Protegemos la ruta para ADMIN
checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");

// Render categorías (si tu HTML incluye un sidebar con <ul id="lista-categorias"> lo llenará, si no, no hace nada)
const renderCategorias = async () => {
    if (!listaCategorias) return;
    try {
        const categorias = await getCategorias();
        // primera opción "Todas"
        listaCategorias.innerHTML = '<li class="active"><a href="#" data-id="">Todas</a></li>';
        (categorias ?? []).forEach((cat: ICategoria) => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-id="${cat.id}">${cat.nombre}</a>`;
            listaCategorias.appendChild(li);
        });

        // listener de delegación para filtrar
        listaCategorias.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            if (target.tagName !== 'A') return;
            // remover active
            listaCategorias.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            target.parentElement?.classList.add('active');

            const catId = target.dataset.id;
            categoriaSeleccionada = catId ? parseInt(catId) : null;
            renderProductos();
        });
    } catch (err) {
        console.error("Error cargando categorías (admin):", err);
    }
};

// Render productos (sin botón de agregar)
const renderProductos = async () => {
    try {
        if (todosLosProductos.length === 0) {
            todosLosProductos = await getProductos();
        }

        const productosFiltrados = categoriaSeleccionada
            ? todosLosProductos.filter(p => p.categoriaId === categoriaSeleccionada)
            : todosLosProductos;

        gridProductos.innerHTML = '';

        if (!productosFiltrados || productosFiltrados.length === 0) {
            gridProductos.innerHTML = '<p>No hay productos para mostrar.</p>';
            return;
        }

        productosFiltrados.forEach((prod: IProducto) => {
            const card = document.createElement('div');
            card.className = 'product-card admin-view';
            // estructura igual que el usuario pero SIN el botón de "Agregar"
            card.innerHTML = `
                <img src="${prod.imagenURL}" class="img-product" alt="${prod.nombre}">
                <div class="card-body">
                  <h3>${prod.nombre}</h3>
                  <p class="desc">${prod.descripcion ?? ''}</p>
                  <p class="price">$${prod.precio}</p>
                </div>
            `;

            // click en la tarjeta abre la vista de detalle (si existe)
            card.addEventListener('click', () => {
                navigate(`/src/pages/store/productDetail/productDetail.html?id=${prod.id}`);
            });

            gridProductos.appendChild(card);
        });

        // arreglar foco/estilos (no hay botón por lo que no hay listeners extra)
    } catch (err) {
        console.error("Error cargando productos (admin):", err);
        gridProductos.innerHTML = '<p>Error al cargar productos.</p>';
    }
};

// Logout
buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

// Inicialización
const initPage = async () => {
    try {
        await Promise.all([
            renderCategorias(),
            renderProductos()
        ]);
    } catch (err) {
        console.error("Error inicializando adminStore:", err);
    }
};

initPage();

export {};
