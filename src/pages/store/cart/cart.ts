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

// Modal Checkout (ya existe en el HTML)
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

/* -------------------------
   UTIL: MODALES DINÁMICOS
   -------------------------
   showInfoModal(title, text) -> Promise<void>
   showConfirmModal(title, text) -> Promise<boolean>
*/

const createModalElement = (innerHtml: string) => {
  const backdrop = document.createElement('div');
  backdrop.className = 'dynamic-modal-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.left = '0';
  backdrop.style.top = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.display = 'flex';
  backdrop.style.alignItems = 'center';
  backdrop.style.justifyContent = 'center';
  backdrop.style.zIndex = '9999';
  backdrop.style.background = 'rgba(0,0,0,0.4)';

  const container = document.createElement('div');
  container.className = 'dynamic-modal';
  container.style.background = '#fff';
  container.style.padding = '20px';
  container.style.borderRadius = '10px';
  container.style.width = 'min(560px, 92%)';
  container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
  container.innerHTML = innerHtml;

  backdrop.appendChild(container);
  document.body.appendChild(backdrop);
  return { backdrop, container };
};

export const showInfoModal = (title: string, text: string) => {
  return new Promise<void>((resolve) => {
    const inner = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <h3 style="margin:0">${title}</h3>
        <div style="white-space:pre-wrap">${text}</div>
        <div style="display:flex;justify-content:flex-end;margin-top:8px">
          <button id="dynamic-ok" class="btn btn-primary">Aceptar</button>
        </div>
      </div>
    `;
    const { backdrop } = createModalElement(inner);
    const ok = backdrop.querySelector('#dynamic-ok') as HTMLButtonElement;
    ok.focus();
    const cleanup = () => {
      backdrop.remove();
      resolve();
    };
    ok.addEventListener('click', cleanup);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup();
    });
  });
};

export const showConfirmModal = (title: string, text: string) => {
  return new Promise<boolean>((resolve) => {
    const inner = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <h3 style="margin:0">${title}</h3>
        <div style="white-space:pre-wrap">${text}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <button id="dynamic-cancel" class="btn">Cancelar</button>
          <button id="dynamic-yes" class="btn btn-primary">Aceptar</button>
        </div>
      </div>
    `;
    const { backdrop } = createModalElement(inner);
    const yes = backdrop.querySelector('#dynamic-yes') as HTMLButtonElement;
    const cancel = backdrop.querySelector('#dynamic-cancel') as HTMLButtonElement;
    const cleanup = (result: boolean) => {
      backdrop.remove();
      resolve(result);
    };
    yes.addEventListener('click', () => cleanup(true));
    cancel.addEventListener('click', () => cleanup(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup(false);
    });
  });
};

/* -------------------------
   CARGA Y RENDER DEL CARRITO
   ------------------------- */

const cargarProductosCarrito = async () => {
  const cartItems = getCart();

  if (!cartItems || cartItems.length === 0) {
    mostrarCarritoVacio();
    return;
  }

  try {
    const promesas = cartItems.map(async (item) => {
      const producto = await getProducto(item.productId);
      return { ...(producto ?? {}), quantity: item.quantity } as IProducto & { quantity: number };
    });

    productosCarrito = await Promise.all(promesas);
    renderizarCarrito();

  } catch (error) {
    console.error("Error al cargar productos del carrito:", error);
    await showInfoModal("Error", "Error al cargar los productos del carrito.");
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

  // listeners (async where confirm used)
  document.querySelectorAll(".btn-decrease").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
      const producto = productosCarrito.find(p => p.id === id);
      if (producto) {
        const nuevaCantidad = producto.quantity - 1;
        if (nuevaCantidad <= 0) {
          const confirmar = await showConfirmModal("Eliminar producto", "La cantidad bajó a 0. ¿Deseas eliminar el producto del carrito?");
          if (confirmar) {
            removeFromCart(id);
          }
        } else {
          updateQuantity(id, nuevaCantidad);
        }
        await cargarProductosCarrito();
      }
    });
  });

  document.querySelectorAll(".btn-increase").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
      const producto = productosCarrito.find(p => p.id === id);
      if (producto) {
        if (typeof producto.stock === 'number' && producto.quantity >= producto.stock) {
          await showInfoModal("Stock insuficiente", `Stock máximo disponible para "${producto.nombre}": ${producto.stock}`);
          return;
        }
        updateQuantity(id, producto.quantity + 1);
        await cargarProductosCarrito();
      }
    });
  });

  document.querySelectorAll(".btn-remove").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = parseInt((e.currentTarget as HTMLElement).dataset.id!);
      const confirmar = await showConfirmModal("Eliminar producto", "¿Eliminar este producto del carrito?");
      if (confirmar) {
        removeFromCart(id);
        await cargarProductosCarrito();
      }
    });
  });

  actualizarTotales();
};

/* -------------------------
   TOTALES / UI
   ------------------------- */

const actualizarTotales = () => {
  const subtotal = productosCarrito.reduce(
    (acc, prod) => acc + (Number(prod.precio) * Number(prod.quantity)),
    0
  );
  const total = subtotal + COSTO_ENVIO;

  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;
  modalTotal.textContent = `$${total.toFixed(2)}`;

  (btnCheckout.dataset as any).subtotal = subtotal.toString();
};

/* -------------------------
   BOTONES PRINCIPALES
   ------------------------- */

btnVaciar.addEventListener("click", async () => {
  const confirmar = await showConfirmModal("Vaciar carrito", "¿Estás seguro de vaciar el carrito?");
  if (confirmar) {
    clearCart();
    await cargarProductosCarrito();
  }
});

btnCheckout.addEventListener("click", () => {
  if (!productosCarrito || productosCarrito.length === 0) {
    showInfoModal("Carrito vacío", "El carrito está vacío.");
    return;
  }
  modal.style.display = "flex";
});

// Cerrar modal de checkout (HTML existente)
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

/* -------------------------
   CHECKOUT: validar stock, crear pedido y actualizar stock
   ------------------------- */

formCheckout.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = getCurrentUser();
  if (!usuario) {
    await showInfoModal("Error", "Usuario no autenticado.");
    return;
  }

  const usuarioId = usuario.id;
  const telefono = (document.getElementById("telefono") as HTMLInputElement).value;
  const direccion = (document.getElementById("direccion") as HTMLInputElement).value;
  const metodoPago = (document.getElementById("metodoPago") as HTMLSelectElement).value;
  const notas = (document.getElementById("notas") as HTMLTextAreaElement).value;

  const subtotal = Number((btnCheckout.dataset as any).subtotal ?? 0);
  const total = subtotal + COSTO_ENVIO;

  try {
    btnCheckout.disabled = true;
    btnCheckout.textContent = "Verificando stock...";

    const checkPromises = productosCarrito.map(item => getProducto(item.id));
    const productosActuales = await Promise.all(checkPromises);

    const insuficientes: { id: number, nombre: string, stock: number, pedido: number }[] = [];

    productosActuales.forEach((prodActual, idx) => {
      const pedidoQty = productosCarrito[idx].quantity;
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
      const mensajes = insuficientes.map(i => `"${i.nombre}": stock=${i.stock}, pedido=${i.pedido}`).join("\n");
      await showInfoModal("Stock insuficiente", `No hay stock suficiente para los siguientes productos:\n${mensajes}\n\nActualizá la cantidad o eliminá el producto.`);
      btnCheckout.disabled = false;
      btnCheckout.textContent = "Confirmar Pedido";
      return;
    }

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
    const creado = await crearPedido(pedidoData);

    btnCheckout.textContent = "Actualizando stock...";

    const updatePromises = productosActuales.map((prodActual, idx) => {
      const qtyComprada = productosCarrito[idx].quantity;
      const nuevoStock = (prodActual.stock ?? 0) - qtyComprada;

      const productoDto = {
        nombre: prodActual.nombre,
        descripcion: prodActual.descripcion,
        precio: prodActual.precio,
        stock: nuevoStock,
        categoriaId: prodActual.categoria ? prodActual.categoria.id ?? prodActual.categoriaId : prodActual.categoriaId ?? null,
        imagenURL: prodActual.imagenURL
      };

      return actualizarProducto(prodActual.id, productoDto);
    });

    await Promise.all(updatePromises);

    clearCart();
    await cargarProductosCarrito();

    await showInfoModal("Éxito", "¡Pedido realizado con éxito!");
    navigate("/src/pages/client/orders/orders.html");

  } catch (error) {
    console.error("Error al procesar checkout:", error);
    await showInfoModal("Error", "Error al procesar el pedido. Intenta nuevamente.");
    btnCheckout.disabled = false;
    btnCheckout.textContent = "Confirmar Pedido";
  }
});

/* -------------------------
   LOGOUT / INIT
   ------------------------- */

buttonLogout.addEventListener("click", () => {
  logoutUser();
  navigate("/src/pages/auth/login/login.html");
});

const initPage = () => {
  checkAuthUser("USUARIO", "/src/pages/auth/login/login.html");
  cargarProductosCarrito();
};

initPage();

export {};
