import axios from 'axios';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get('/api/products');
  return response.data;
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const response = await axios.post('/api/products', product);
  return response.data;
};

export const updateProduct = async (product: Product): Promise<Product> => {
  const response = await axios.put(`/api/products/${product.id}`, product);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`/api/products/${id}`);
};