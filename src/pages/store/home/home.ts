// src/pages/store/catalog/catalog.ts
import { checkAuthUser } from "../../../utils/auth";
import { logoutUser } from "../../../utils/localStorage";
import { navigate } from "../../../utils/navigate";
import { getCategorias, getProductos, getProducto } from "../../../utils/api";
import type { ICategoria } from "../../../types/ICategoria";
import type { IProducto } from "../../../types/IProducto";
import { addToCart, getCartCount } from "../../../utils/cart";

// --- DOM ---
const buttonLogout = document.getElementById("button_logout") as HTMLButtonElement;
const listaCategorias = document.getElementById("lista-categorias") as HTMLUListElement;
const gridProductos = document.getElementById("grid-productos") as HTMLDivElement;
const cartBadge = document.querySelector('.cart-badge') as HTMLSpanElement;
const userName = document.getElementById("user-name") as HTMLSpanElement;
const user = localStorage.getItem("userData");
userName.textContent = user ? JSON.parse(user).nombre : "USUARIO";

// --- Estado ---
let todosLosProductos: IProducto[] = [];
let categoriaSeleccionada: number | null = null;

// ---------------------------
// MODALES DINÁMICOS (reutilizables)
// ---------------------------
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

// ---------------------------
// UTIL: contador carrito
// ---------------------------
const actualizarContadorCarrito = () => {
  const count = getCartCount();
  if (cartBadge) cartBadge.textContent = count.toString();
};

// ---------------------------
// CATEGORIAS
// ---------------------------
const renderCategorias = async () => {
  try {
    const categorias = await getCategorias();
    listaCategorias.innerHTML = '<li class="active"><a href="#" data-id="">Todas</a></li>';
    (categorias ?? []).forEach((cat: ICategoria) => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-id="${cat.id}">${cat.nombre}</a>`;
      listaCategorias.appendChild(li);
    });

    listaCategorias.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        listaCategorias.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        target.parentElement?.classList.add('active');
        const catId = target.dataset.id;
        categoriaSeleccionada = catId ? parseInt(catId) : null;
        void renderProductos();
      }
    });

  } catch (error) {
    console.error("Error al cargar categorías", error);
    await showInfoModal("Error", "No se pudieron cargar las categorías.");
  }
};

// ---------------------------
// PRODUCTOS / GRID
// ---------------------------
const renderProductos = async () => {
  try {
    if (todosLosProductos.length === 0) {
      todosLosProductos = await getProductos() ?? [];
    }

    const productosFiltrados = categoriaSeleccionada
      ? todosLosProductos.filter(p => p.categoriaId === categoriaSeleccionada)
      : todosLosProductos;

    gridProductos.innerHTML = '';

    if (!productosFiltrados || productosFiltrados.length === 0) {
      gridProductos.innerHTML = '<p>No hay productos en esta categoría.</p>';
      return;
    }

    // Crear las tarjetas
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

      // Click en la tarjeta → detalle (si no clikean el botón)
      card.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).classList.contains('btn-agregar')) {
          navigate(`/src/pages/store/productDetail/productDetail.html?id=${prod.id}`);
        }
      });

      gridProductos.appendChild(card);
    });

    // listeners botones Agregar
    document.querySelectorAll('.btn-agregar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idStr = (e.currentTarget as HTMLElement).dataset.id;
        if (!idStr) return;
        const id = parseInt(idStr);

        try {
          // Consultar producto actual (stock en backend)
          const prodActual = await getProducto(id);
          if (!prodActual) {
            await showInfoModal("Error", "No se pudo obtener la información del producto.");
            return;
          }

          // Validar stock — Si el backend no expone stock, asumimos que está disponible
          const cantidadEnCarrito = getCartCount(); // nota: esto da total items, no por producto; solo para info rápida
          // Mejor buscamos si ya está en carrito: (si existe el getCart util lo podrías usar; acá uso getCartCount por simplicidad)
          // Para validar correctamente cantidad por producto necesitamos leer el carrito local:
          const cartRaw = (await import("../../../utils/cart")).getCart(); // import dinámico para evitar ciclos
          const existente = cartRaw.find((it: any) => it.productId === id);
          const cantidadActual = existente ? existente.quantity : 0;

          if (typeof prodActual.stock === 'number' && cantidadActual + 1 > prodActual.stock) {
            await showInfoModal("Stock insuficiente", `No hay stock suficiente para "${prodActual.nombre}". Stock disponible: ${prodActual.stock}`);
            return;
          }

          // Agregar al carrito y mostrar modal de éxito
          addToCart(id);
          actualizarContadorCarrito();
          await showInfoModal("Producto agregado", `"${prodActual.nombre}" se agregó al carrito.`);
        } catch (err) {
          console.error("Error al agregar al carrito:", err);
          await showInfoModal("Error", "No se pudo agregar el producto al carrito. Intentá nuevamente.");
        }
      });
    });

  } catch (error) {
    console.error("Error al cargar productos", error);
    gridProductos.innerHTML = '<p>No se pudieron cargar los productos.</p>';
    await showInfoModal("Error", "No se pudieron cargar los productos desde el servidor.");
  }
};

// ---------------------------
// LOGOUT / INIT
// ---------------------------
buttonLogout.addEventListener("click", () => {
  logoutUser();
  navigate("/src/pages/auth/login/login.html");
});

const initPage = async () => {
  checkAuthUser("USUARIO", "/src/pages/auth/login/login.html");
  actualizarContadorCarrito();
  try {
    await Promise.all([renderCategorias(), renderProductos()]);
  } catch (err) {
    console.error("Error inicializando catálogo:", err);
  }
};

initPage();

export { };
