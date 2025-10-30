const API_URL = 'http://localhost:8080';

export const crearUsuario = async (usuarioData: {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: string;
}) => {
  try {
    console.log("Intento de Crear Usuario con body:", usuarioData);
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usuarioData),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error ${response.status}: ${response.statusText} - ${text}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    throw error;
  }
};

export const loginUsuario = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {  
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      alert("❌ Usuario o contraseña incorrectos");
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    alert("Error de conexión con el servidor");
    return null;
  }
};