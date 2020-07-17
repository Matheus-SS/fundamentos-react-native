import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem('@GoMarketplace:products');

      if (product) {
        setProducts([...JSON.parse(product)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      let newProducts;
      const productExists = products.find(prod => prod.id === product.id);

      if (productExists) {
        newProducts = products.map(prod =>
          prod.id === product.id
            ? {
                ...prod,
                quantity: prod.quantity + 1,
              }
            : prod,
        );
        setProducts(newProducts);
      } else {
        newProducts = [...products, { ...product, quantity: 1 }];
        setProducts(newProducts);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );

      // await AsyncStorage.clear();
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? {
              ...product,
              quantity: product.quantity + 1,
            }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity - 1 };
        }

        return product;
      });

      // remover do carrinho caso diminua quantidade até 0
      newProducts.forEach((product, index) => {
        if (product.id === id && product.quantity === 0) {
          newProducts.splice(index, 1);
        }
        return product;
      });

      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
