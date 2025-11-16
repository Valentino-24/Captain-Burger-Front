// Definimos la estructura de un ítem en el carrito
export interface ICartItem {
    productId: number;
    quantity: number;
}

// Clave para almacenar el carrito en localStorage
const CART_KEY = 'shoppingCart';

// Obtiene el carrito actual desde localStorage
export const getCart = (): ICartItem[] => {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
};

// Guarda el carrito actualizado en localStorage

const saveCart = (cart: ICartItem[]): void => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

// Agrega un producto al carrito

export const addToCart = (productId: number) => {
    // 1. Obtenemos el carrito actual
    const cart = getCart();

    // 2. Buscamos si el producto ya está en el carrito
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        // 3. Si ya existe, solo aumentamos la cantidad
        existingItem.quantity += 1;
    } else {
        // 4. Si es nuevo, lo agregamos al array con cantidad 1
        cart.push({ productId: productId, quantity: 1 });
    }

    // 5. Guardamos el carrito actualizado en localStorage
    saveCart(cart);

    // 6. Damos feedback al usuario (opcional pero útil)
    console.log('Carrito actualizado:', cart);
};


// Elimina un producto del carrito
export const removeFromCart = (productId: number): void => {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.productId !== productId);
    saveCart(updatedCart);
};

// Actualiza la cantidad de un producto en el carrito
export const updateQuantity = (productId: number, quantity: number): void => {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
};

// Limpia todo el carrito
export const clearCart = (): void => {
    localStorage.removeItem(CART_KEY);
};

// Obtiene el número total de ítems en el carrito
export const getCartCount = (): number => {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
};