const API_URL = 'http://localhost:8080';

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text || res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

/* ---------- USUARIOS (existente) ---------- */
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
/**
 * Nota: el backend usa ProductoDTO { id, nombre, descripcion, precio, categoriaId, imagenURL }
 * En el front usamos IProducto { id, nombre, descripcion, precio, stock?, categoriaId, imagen, disponible? }
 * Mapeamos imagen <-> imagenURL y ignoramos stock/disponible (según lo solicitado).
 */

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

/* ---------- CATEGORIAS (opcional, si existe el endpoint) ---------- */
export const getCategorias = async () => {
  try {
    const res = await fetch(`${API_URL}/categorias`, { method: 'GET' });
    return await handleResponse(res);
  } catch (err) {
    // No hacer crash si no existe el endpoint: el front puede usar la lista local de fallback
    console.warn('No se pudo obtener categorías desde backend:', err);
    return null;
  }
};
