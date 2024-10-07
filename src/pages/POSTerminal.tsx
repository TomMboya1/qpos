import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, Product } from '../api/products';
import { createOrder } from '../api/orders';
import { getCustomers, Customer, addLoyaltyPoints } from '../api/customers';
import { Plus, Minus, X, CreditCard, Search, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum(['cash', 'card', 'loyalty_points']),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const POSTerminal: React.FC = () => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema)
  });

  const { data: products } = useQuery<Product[]>(['products'], getProducts);
  const { data: customers } = useQuery<Customer[]>(['customers'], () => getCustomers(1, ''));

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products?.find(p => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert('Product not found');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const createOrderMutation = useMutation(createOrder, {
    onSuccess: () => {
      queryClient.invalidateQueries('orders');
      setCart([]);
      setSelectedCustomer(null);
      setIsPaymentModalOpen(false);
      alert('Order placed successfully!');
    },
    onError: (error) => {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    },
  });

  const addLoyaltyPointsMutation = useMutation(
    ({ customerId, points }: { customerId: string; points: number }) =>
      addLoyaltyPoints(customerId, points),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('customers');
      },
    }
  );

  const handlePayment = (data: PaymentFormData) => {
    const order = {
      customerId: selectedCustomer?.id || 'walk-in-customer',
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      total: total,
      paymentMethod: data.method,
      status: 'completed'
    };

    createOrderMutation.mutate(order);

    if (selectedCustomer) {
      const loyaltyPoints = Math.floor(total);
      addLoyaltyPointsMutation.mutate({ customerId: selectedCustomer.id, points: loyaltyPoints });
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleBarcodeSubmit(e as unknown as React.FormEvent);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [barcodeInput, products]);

  return (
    <div className="flex h-full">
      <div className="w-2/3 p-4 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="grid grid-cols-3 gap-4">
          {products?.map(product => (
            <div
              key={product.id}
              className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <h3 className="font-semibold">{product.name}</h3>
              <p>${product.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/3 bg-gray-100 p-4 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Cart</h2>
        <form onSubmit={handleBarcodeSubmit} className="mb-4">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan barcode"
            className="w-full p-2 border rounded"
          />
        </form>
        <div className="flex-grow overflow-y-auto mb-4">
          {cart.map(item => (
            <div key={item.product.id} className="flex justify-between items-center mb-2">
              <span>{item.product.name}</span>
              <div className="flex items-center">
                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1">
                  <Minus size={16} />
                </button>
                <span className="mx-2">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1">
                  <Plus size={16} />
                </button>
                <button onClick={() => removeFromCart(item.product.id)} className="ml-2 text-red-500">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xl font-semibold mb-4">
          Total: ${total.toFixed(2)}
        </div>
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="bg-blue-500 text-white p-2 rounded flex items-center justify-center mb-2"
        >
          <User className="mr-2" />
          {selectedCustomer ? `Customer: ${selectedCustomer.name}` : 'Select Customer'}
        </button>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-green-500 text-white p-2 rounded flex items-center justify-center"
          disabled={cart.length === 0}
        >
          <CreditCard className="mr-2" />
          Proceed to Payment
        </button>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Select Customer</h2>
            <input
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="max-h-60 overflow-y-auto">
              {customers?.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())).map(customer => (
                <div
                  key={customer.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setIsCustomerModalOpen(false);
                  }}
                >
                  {customer.name} - {customer.email}
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="mt-4 bg-red-500 text-white p-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            <form onSubmit={handleSubmit(handlePayment)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount Due</label>
                <input
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  defaultValue={total}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  {...register('method')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  {selectedCustomer && <option value="loyalty_points">Loyalty Points</option>}
                </select>
                {errors.method && <p className="mt-1 text-sm text-red-600">{errors.method.message}</p>}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="mr-2 bg-gray-200 text-gray-700 p-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white p-2 rounded"
                >
                  Complete Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;