import axios from 'axios';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export const getOrders = async (): Promise<Order[]> => {
  const response = await axios.get('/api/orders');
  return response.data;
};

export const createOrder = async (order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
  const response = await axios.post('/api/orders', order);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order> => {
  const response = await axios.patch(`/api/orders/${id}`, { status });
  return response.data;
};