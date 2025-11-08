// src/pages/store/cart/cart.ts
import { checkAuthUser, getCurrentUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getCart, updateQuantity, removeFromCart, clearCart } from "../../../utils/cart";
import { getProducto, crearPedido, actualizarProducto } from "../../../utils/api";
import type { IProducto } from "../../../types/IProducto";
import type { EstadoPedido } from "../../../types/IPedido";

// Elementos del DOM
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const emptyCart = document.getElementById("empty-cart") as HTMLDivElement;
const cartContent = document.getElementById("cart-content") as HTMLDivElement;
const cartItemsList = document.getElementById("cart-items-list") as HTMLDivElement;
const subtotalElement = document.getElementById("subtotal") as HTMLSpanElement;
const totalElement = document.getElementById("total") as HTMLSpanElement;
const btnCheckout = document.getElementById("btn-checkout") as HTMLButtonElement;
const btnVaciar = document.getElementById("btn-vaciar") as HTMLButtonElement;
const userName = document.getElementById("user-name") as HTMLSpanElement;

// Modal
const modal = document.getElementById("modal-checkout") as HTMLDivElement;
const modalClose = document.querySelector(".modal-close") as HTMLSpanElement;
const formCheckout = document.getElementById("form-checkout") as HTMLFormElement;
const btnCancelarCheckout = document.getElementById("btn-cancelar-checkout") as HTMLButtonElement;
const modalTotal = document.getElementById("modal-total") as HTMLSpanElement;

const user = localStorage.getItem("userData");
userName.textContent = user ? JSON.parse(user).nombre : "USUARIO";

// Constantes
const COSTO_ENVIO = 500;

// Variables globales
// productosCarrito contiene la info completa del producto tal como la devuelve getProducto + quantity
let productosCarrito: Array<IProducto & { quantity: number }> = [];

// --- CARGA Y RENDERIZADO DEL CARRITO ---

/**
 * Carga los productos del carrito desde localStorage (getCart)
 * y trae la información actual de cada producto desde el backend (getProducto).
 */
const cargarProductosCarrito = async () => {
    const cartItems = getCart();

    if (!cartItems || cartItems.length === 0) {
        mostrarCarritoVacio();
        return;
    }

    try {
        // Obtener información completa y actualizada de cada producto
        const promesas = cartItems.map(async (item) => {
            const producto = await getProducto(item.productId);
            // asegurar que venga algo válido
            return { ...(producto ?? {}), quantity: item.quantity } as IProducto & { quantity: number };
        });

        productosCarrito = await Promise.all(promesas);
        renderizarCarrito();

    } catch (error) {
        console.error("Error al cargar productos del carrito:", error);
        alert("Error al cargar los productos del carrito");
    }
};

const mostrarCarritoVacio = () => {
    emptyCart.style.display = "block";
    cartContent.style.display = "none";
    cartItemsList.innerHTML = "";
    subtotalElement.textContent = "$0.00";
    totalElement.textContent = "$0.00";
    modalTotal.textContent = "$0.00";
};

// Renderiza los productos en el carrito (DOM)
const renderizarCarrito = () => {
    if (!productosCarrito || productosCarrito.length === 0) {
        mostrarCarritoVacio();
        return;
    }

    emptyCart.style.display = "none";
    cartContent.style.display = "block";
    cartItemsList.innerHTML = "";

    productosCarrito.forEach((producto) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "cart-item";
        itemDiv.innerHTML = `
            <img src="${producto.imagenURL || '/placeholder.jpg'}" alt="${producto.nombre}">
            
            <div class="cart-item-info">
                <h3>${producto.nombre}</h3>
                <p class="item-price">$${producto.precio.toFixed(2)}</p>
                <p class="item-stock">Stock disponible: ${typeof producto.stock === 'number' ? producto.stock : 'N/D'}</p>
            </div>

            <div class="cart-item-quantity">
                <button class="btn-quantity btn-decrease" data-id="${producto.id}">-</button>
                <span class="quantity">${producto.quantity}</span>
                <button class="btn-quantity btn-increase" data-id="${producto.id}">+</button>
            </div>

            <div class="cart-item-total">
                <p>$${(producto.precio * producto.quantity).toFixed(2)}</p>
            </div>

            <button class="btn-remove" data-id="${producto.id}">
                <span>🗑️</span>
            </button>
        `;

        cartItemsList.appendChild(itemDiv);
    });

    // Event listeners para botones de cantidad
    document.querySelectorAll(".btn-decrease").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
            const producto = productosCarrito.find(p => p.id === id);
            if (producto) {
                const nuevaCantidad = producto.quantity - 1;
                if (nuevaCantidad <= 0) {
                    // Eliminar si llega a 0
                    if (confirm("La cantidad bajó a 0. ¿Deseas eliminar el producto del carrito?")) {
                        removeFromCart(id);
                    }
                } else {
                    updateQuantity(id, nuevaCantidad);
                }
                cargarProductosCarrito();
            }
        });
    });

    document.querySelectorAll(".btn-increase").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
            const producto = productosCarrito.find(p => p.id === id);
            if (producto) {
                // Validar stock local (nota: se volverá a validar en el checkout contra backend)
                if (typeof producto.stock === 'number' && producto.quantity >= producto.stock) {
                    alert(`Stock máximo disponible para "${producto.nombre}": ${producto.stock}`);
                    return;
                }
                updateQuantity(id, producto.quantity + 1);
                cargarProductosCarrito();
            }
        });
    });

    // Event listeners para botones de eliminar
    document.querySelectorAll(".btn-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
            if (confirm("¿Eliminar este producto del carrito?")) {
                removeFromCart(id);
                cargarProductosCarrito();
            }
        });
    });

    actualizarTotales();
};

// Actualiza los totales (subtotal y total con envío)
const actualizarTotales = () => {
    const subtotal = productosCarrito.reduce(
        (acc, prod) => acc + (Number(prod.precio) * Number(prod.quantity)),
        0
    );
    const total = subtotal + COSTO_ENVIO;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    modalTotal.textContent = `$${total.toFixed(2)}`;

    // Guardamos el total numérico en el dataset del botón para evitar parseos posteriores
    (btnCheckout.dataset as any).subtotal = subtotal.toString();
};

// Vaciar carrito
btnVaciar.addEventListener("click", () => {
    if (confirm("¿Estás seguro de vaciar el carrito?")) {
        clearCart();
        cargarProductosCarrito();
    }
});

// Abrir modal de checkout
btnCheckout.addEventListener("click", () => {
    if (!productosCarrito || productosCarrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }
    modal.style.display = "flex";
});

// Cerrar modal de checkout
modalClose.addEventListener("click", () => {
    modal.style.display = "none";
});
btnCancelarCheckout.addEventListener("click", () => {
    modal.style.display = "none";
});
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// --- CHECKOUT: validar stock, crear pedido y actualizar stock en backend ---

formCheckout.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = getCurrentUser();
    if (!usuario) {
        alert("Error: Usuario no autenticado");
        return;
    }
    const usuarioId = usuario.id;
    const telefono = (document.getElementById("telefono") as HTMLInputElement).value;
    const direccion = (document.getElementById("direccion") as HTMLInputElement).value;
    const metodoPago = (document.getElementById("metodoPago") as HTMLSelectElement).value;
    const notas = (document.getElementById("notas") as HTMLTextAreaElement).value;

    // total numérico desde la función actualizarTotales
    const subtotal = Number((btnCheckout.dataset as any).subtotal ?? 0);
    const total = subtotal + COSTO_ENVIO;

    // 1) Volver a consultar stock actualizado en backend para cada producto del carrito
    try {
        btnCheckout.disabled = true;
        btnCheckout.textContent = "Verificando stock...";

        // Pedimos el producto actual para cada item (paralelo)
        const checkPromises = productosCarrito.map(item => getProducto(item.id));
        const productosActuales = await Promise.all(checkPromises);

        // 2) Verificamos stock
        const insuficientes: { id: number, nombre: string, stock: number, pedido: number }[] = [];

        productosActuales.forEach((prodActual, idx) => {
            const pedidoQty = productosCarrito[idx].quantity;
            // si backend no devuelve stock como número => consideramos error
            if (prodActual == null || typeof prodActual.stock !== 'number') {
                insuficientes.push({
                    id: productosCarrito[idx].id,
                    nombre: productosCarrito[idx].nombre,
                    stock: 0,
                    pedido: pedidoQty
                });
            } else if (prodActual.stock < pedidoQty) {
                insuficientes.push({
                    id: prodActual.id,
                    nombre: prodActual.nombre ?? productosCarrito[idx].nombre,
                    stock: prodActual.stock,
                    pedido: pedidoQty
                });
            }
        });

        if (insuficientes.length > 0) {
            // Mostrar mensaje detallado y abortar
            const mensajes = insuficientes.map(i => `"${i.nombre}": stock=${i.stock}, pedido=${i.pedido}`).join("\n");
            alert(`No hay stock suficiente para los siguientes productos:\n${mensajes}\n\nActualizá la cantidad o eliminá el producto.`);
            btnCheckout.disabled = false;
            btnCheckout.textContent = "Confirmar Pedido";
            return;
        }

        // 3) Si todo OK: armar payload del pedido
        const pedidoData = {
            usuarioId: usuarioId!,
            telefono,
            estado: 'pending' as EstadoPedido,
            total,
            direccion,
            metodoPago,
            notas: notas || undefined,
            detalles: productosCarrito.map(p => ({
                productoId: p.id,
                productoNombre: p.nombre,
                productoImagen: p.imagenURL,
                cantidad: p.quantity,
                precioUnitario: p.precio
            }))
        };

        btnCheckout.textContent = "Creando pedido...";
        // 4) Crear pedido en backend
        const creado = await crearPedido(pedidoData);

        // 5) Si pedido creado OK, actualizar stock para cada producto (restamos cantidad)
        btnCheckout.textContent = "Actualizando stock...";

        // Re-uso productosActuales (tenemos stock)
        const updatePromises = productosActuales.map((prodActual, idx) => {
            const qtyComprada = productosCarrito[idx].quantity;
            const nuevoStock = (prodActual.stock ?? 0) - qtyComprada;

            // Construir payload de producto según tu API (asegurate de incluir los campos requeridos)
            const productoDto = {
                nombre: prodActual.nombre,
                descripcion: prodActual.descripcion,
                precio: prodActual.precio,
                stock: nuevoStock,
                categoriaId: prodActual.categoria ? prodActual.categoria.id ?? prodActual.categoriaId : prodActual.categoriaId ?? null,
                imagenURL: prodActual.imagenURL
            };

            // actualizarProducto espera (id, productoDto)
            return actualizarProducto(prodActual.id, productoDto);
        });

        await Promise.all(updatePromises);

        // 6) Limpiar carrito y UI
        clearCart();
        cargarProductosCarrito();

        alert("¡Pedido realizado con éxito!");
        navigate("/src/pages/client/orders/orders.html");

    } catch (error) {
        console.error("Error al procesar checkout:", error);
        alert("Error al procesar el pedido. Intenta nuevamente.");
        btnCheckout.disabled = false;
        btnCheckout.textContent = "Confirmar Pedido";
    }
});

// Logout
buttonLogout.addEventListener("click", () => {
    logoutUser();
    navigate("/src/pages/auth/login/login.html");
});

// Inicialización
const initPage = () => {
    checkAuthUser("USUARIO", "/src/pages/auth/login/login.html");
    cargarProductosCarrito();
};

initPage();

export {};
