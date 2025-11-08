import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getCategorias, getProductos } from "../../../utils/api";
import type { ICategoria } from "../../../types/ICategoria";
import type { IProducto } from "../../../types/IProducto"; // ✅ Cambiado
import { addToCart, getCartCount } from "../../../utils/cart"; // ✅ Agregado getCartCount

// Elementos del DOM
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const listaCategorias = document.getElementById("lista-categorias") as HTMLUListElement;
const gridProductos = document.getElementById("grid-productos") as HTMLDivElement;
const cartBadge = document.querySelector('.cart-badge') as HTMLSpanElement; // ✅ Nuevo

// Variable global para almacenar productos
let todosLosProductos: IProducto[] = [];
let categoriaSeleccionada: number | null = null;

/**
 * Actualiza el contador del carrito en el header
 */
const actualizarContadorCarrito = () => {
    const count = getCartCount();
    if (cartBadge) {
        cartBadge.textContent = count.toString();
    }
};

/**
 * Renderiza las categorías en el sidebar
 */
const renderCategorias = async () => {
    try {
        const categorias = await getCategorias();
        
        listaCategorias.innerHTML = '<li class="active"><a href="#" data-id="">Todas</a></li>';

        categorias.forEach((cat: ICategoria) => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" data-id="${cat.id}">${cat.nombre}</a>`;
            listaCategorias.appendChild(li);
        });

        // ✅ Event listeners para filtrar por categoría
        listaCategorias.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            
            if (target.tagName === 'A') {
                // Quitar clase active de todos
                listaCategorias.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                // Agregar active al seleccionado
                target.parentElement?.classList.add('active');
                
                const catId = target.dataset.id;
                categoriaSeleccionada = catId ? parseInt(catId) : null;
                renderProductos();
            }
        });

    } catch (error) {
        console.error("Error al cargar categorías", error);
    }
};

/**
 * Renderiza los productos (filtrados si hay categoría seleccionada)
 */
const renderProductos = async () => {
    try {
        // Si aún no tenemos productos, los obtenemos
        if (todosLosProductos.length === 0) {
            todosLosProductos = await getProductos();
        }

        // Filtrar productos por categoría si hay una seleccionada
        const productosFiltrados = categoriaSeleccionada 
            ? todosLosProductos.filter(p => p.categoriaId === categoriaSeleccionada)
            : todosLosProductos;

        gridProductos.innerHTML = '';

        if (productosFiltrados.length === 0) {
            gridProductos.innerHTML = '<p>No hay productos en esta categoría.</p>';
            return;
        }

        productosFiltrados.forEach((prod: IProducto) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.width = '220px';
            card.style.cursor = 'pointer';
            card.style.display = 'inline-block';
            card.innerHTML = `
                <img src="${prod.imagenURL}" class="img-product" alt="${prod.nombre}">
                <h3>${prod.nombre}</h3>
                <p>${prod.descripcion}</p>
                <p class="price">$${prod.precio}</p>
                <button class="btn btn-primary btn-agregar" data-id="${prod.id}">Agregar al Carrito</button>
            `;

            // ✅ Click en la card para ir al detalle
            card.addEventListener('click', (e) => {
                // Si no clickearon el botón, ir al detalle
                if (!(e.target as HTMLElement).classList.contains('btn-agregar')) {
                    navigate(`/src/pages/store/productDetail/productDetail.html?id=${prod.id}`);
                }
            });

            gridProductos.appendChild(card);
        });

        // ✅ Event listeners para botones "Agregar"
        const botonesAgregar = document.querySelectorAll('.btn-agregar');
        botonesAgregar.forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que se dispare el click de la card
                const id = (boton as HTMLElement).dataset.id;

                if (id) {
                    addToCart(parseInt(id));
                    actualizarContadorCarrito(); // ✅ Actualizar contador
                }
            });
        });

    } catch (error) {
        console.error("Error al cargar productos", error);
        gridProductos.innerHTML = '<p>No se pudieron cargar los productos.</p>';
    }
};

// Logout
buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

// Inicialización
const initPage = async () => {
    checkAuthUser("ADMIN", "/src/pages/auth/login/login.html");
    actualizarContadorCarrito(); // ✅ Actualizar al cargar
    
    try {
        await Promise.all([
            renderCategorias(),
            renderProductos()
        ]);
    } catch (error) {
        console.error("Error al inicializar la página", error);
    }
};

initPage();

export { };