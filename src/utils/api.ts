const API_URL = 'http://localhost:8080';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- USUARIOS ---------- */
export const crearUsuario = async (usuarioData: {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioData),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    throw error;
  }
};

export const loginUsuario = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      alert("❌ Usuario o contraseña incorrectos");
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    alert("Error de conexión con el servidor");
    return null;
  }
};

/* ---------- PRODUCTOS ---------- */

export const getProductos = async () => {
  try {
    const res = await fetch(`${API_URL}/productos`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    throw err;
  }
};

export const getProducto = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al obtener producto:', err);
    throw err;
  }
};

export const crearProducto = async (productoDto: {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock:number;
  categoriaId?: number | null;
  imagenURL?: string;
}) => {
  try {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productoDto),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al crear producto:', err);
    throw err;
  }
};

export const actualizarProducto = async (
  id: number,
  productoDto: {
    nombre: string;
    descripcion?: string;
    precio: number;
    stock:number;
    categoriaId?: number | null;
    imagenURL?: string;
  }
) => {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productoDto),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    throw err;
  }
};

export const borrarProducto = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    throw err;
  }
};

/* ---------- CATEGORIAS ---------- */

export const getCategorias = async () => {
  try {
    const res = await fetch(`${API_URL}/categorias`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.warn('No se pudo obtener categorías desde backend:', err);
    return null;
  }
};

export const getCategoria = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al obtener categoría:', err);
    throw err;
  }
};

export const crearCategoria = async (categoriaDto: {
  nombre: string;
  descripcion?: string;
}) => {
  try {
    const res = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoriaDto),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al crear categoría:', err);
    throw err;
  }
};

export const actualizarCategoria = async (id: number, categoriaDto: {
  nombre: string;
  descripcion?: string;
}) => {
  try {
    const res = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoriaDto),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    throw err;
  }
};

export const borrarCategoria = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    throw err;
  }
};

/* ---------- PEDIDOS ---------- */

export const crearPedido = async (pedidoData: {
  usuarioId: number;
  telefono: string;
  direccion: string;
  metodoPago: string;
  notas?: string;
  detalles: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario: number;
  }>;
}) => {
  try {
    const res = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al crear pedido:', err);
    throw err;
  }
};

export const getPedidos = async () => {
  try {
    const res = await fetch(`${API_URL}/pedidos`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.warn('No se pudo obtener pedidos desde backend:', err);
    return null;
  }
};

export const getPedidosUsuario = async (usuarioId: number) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/usuario/${usuarioId}`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    throw err;
  }
};

export const getPedido = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al obtener pedido:', err);
    throw err;
  }
};

export const actualizarEstadoPedidoApi = async (id: number, estado: string) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al actualizar estado del pedido:', err);
    throw err;
  }
};


export const actualizarPedido = async (id: number, pedidoData: {
  usuarioId: number;
  telefono: string;
  direccion: string;
  metodoPago: string;
  notas?: string;
  detalles: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario: number;
  }>;
}) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoData),
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    throw err;
  }
};

export const borrarPedido = async (id: number) => {
  try {
    const res = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'DELETE'
    });
    return await handleResponse(res);
  } catch (err) {
    console.error('Error al eliminar pedido:', err);
    throw err;
  }
};
