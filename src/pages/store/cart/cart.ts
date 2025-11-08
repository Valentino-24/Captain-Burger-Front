import { checkAuthUser, getCurrentUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getCart, updateQuantity, removeFromCart, clearCart } from "../../../utils/cart";
import { getProducto, crearPedido } from "../../../utils/api";
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
let productosCarrito: Array<IProducto & { quantity: number }> = [];

// Carga los productos del carrito desde el almacenamiento local y obtiene sus datos completos

const cargarProductosCarrito = async () => {
    const cartItems = getCart();
    
    if (cartItems.length === 0) {
        mostrarCarritoVacio();
        return;
    }

    try {
        // Obtener información completa de cada producto
        const promesas = cartItems.map(async (item) => {
            const producto = await getProducto(item.productId);
            return { ...producto, quantity: item.quantity };
        });

        productosCarrito = await Promise.all(promesas);
        renderizarCarrito();
        
    } catch (error) {
        console.error("Error al cargar productos del carrito:", error);
        alert("Error al cargar los productos del carrito");
    }
};

// Muestra el mensaje de carrito vacío

const mostrarCarritoVacio = () => {
    emptyCart.style.display = "block";
    cartContent.style.display = "none";
};

// Renderiza los productos en el carrito

const renderizarCarrito = () => {
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
                <p class="item-price">$${producto.precio}</p>
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
                updateQuantity(id, nuevaCantidad);
                cargarProductosCarrito();
            }
        });
    });

    document.querySelectorAll(".btn-increase").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
            const producto = productosCarrito.find(p => p.id === id);
            if (producto) {
                // Validar stock
                if (producto.quantity >= producto.stock) {
                    alert(`Stock máximo disponible: ${producto.stock}`);
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

// Actualiza los totales del carrito

const actualizarTotales = () => {
    const subtotal = productosCarrito.reduce(
        (acc, prod) => acc + (prod.precio * prod.quantity), 
        0
    );
    const total = subtotal + COSTO_ENVIO;

    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
    modalTotal.textContent = `$${total.toFixed(2)}`;
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
    modal.style.display = "flex";
});

// Cerrar modal de checkout

modalClose.addEventListener("click", () => {
    modal.style.display = "none";
});

btnCancelarCheckout.addEventListener("click", () => {
    modal.style.display = "none";
});

// Cerrar modal al hacer click fuera
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// Procesar checkout

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
    let total = Number(totalElement.textContent.replace(/[^0-9.-]+/g, ""));
    // Preparar datos del pedido
    const pedidoData = {
        usuarioId: usuarioId!,
        telefono,
        estado: 'pending' as EstadoPedido,
        total: total,
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

    try {
        btnCheckout.disabled = true;
        btnCheckout.textContent = "Procesando...";

        await crearPedido(pedidoData);

        // Limpiar carrito
        clearCart();

        alert("¡Pedido realizado con éxito!");
        
        // Redirigir a mis pedidos
        navigate("/src/pages/client/orders/orders.html");

    } catch (error) {
        console.error("Error al crear pedido:", error);
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

// Inicialización de la página

const initPage = () => {
    checkAuthUser("USUARIO", "/src/pages/auth/login/login.html");
    cargarProductosCarrito();
};

initPage();

export { };