import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  lowStockThreshold: number;
}

const inventorySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  lowStockThreshold: z.number().min(1, 'Low stock threshold must be at least 1'),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema)
  });

  const fetchInventory = async ({ queryKey }: any) => {
    const [_, page, searchTerm] = queryKey;
    const response = await axios.get(`/api/inventory?page=${page}&search=${searchTerm}`);
    return response.data;
  };

  const { data, isLoading, error } = useQuery<{ inventory: InventoryItem[], totalPages: number }>(
    ['inventory', page, searchTerm],
    fetchInventory
  );

  const updateInventoryMutation = useMutation({
    mutationFn: (updatedItem: InventoryItem) => axios.put(`/api/inventory/${updatedItem.id}`, updatedItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const addInventoryMutation = useMutation({
    mutationFn: (newItem: InventoryFormData) => axios.post('/api/inventory', newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsModalOpen(false);
      reset();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {(error as Error).message}</div>;

  const onSubmit = (formData: InventoryFormData) => {
    if (currentItem) {
      updateInventoryMutation.mutate({ ...formData, id: currentItem.id } as InventoryItem);
    } else {
      addInventoryMutation.mutate(formData);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Inventory Management</h2>
      
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search inventory..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Inventory List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.inventory.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.productName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.lowStockThreshold}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.quantity <= item.lowStockThreshold ? (
                    <span className="flex items-center text-red-600">
                      <AlertTriangle size={16} className="mr-1" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="text-green-600">In Stock</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setCurrentItem(item);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    <Edit size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Previous
        </button>
        <span>Page {page} of {data?.totalPages}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === data?.totalPages}
          className="px-4 py-2 border rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Next
        </button>
      </div>

      {/* Add/Edit Inventory Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {currentItem ? 'Update Inventory Item' : 'Add Inventory Item'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label htmlFor="productId" className="block text-sm font-medium text-gray-700">Product ID</label>
                <input
                  type="text"
                  id="productId"
                  {...register('productId')}
                  defaultValue={currentItem?.productId}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.productId && <p className="mt-1 text-sm text-red-600">{errors.productId.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  {...register('quantity', { valueAsNumber: true })}
                  defaultValue={currentItem?.quantity}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
                <input
                  type="number"
                  id="lowStockThreshold"
                  {...register('lowStockThreshold', { valueAsNumber: true })}
                  defaultValue={currentItem?.lowStockThreshold}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.lowStockThreshold && <p className="mt-1 text-sm text-red-600">{errors.lowStockThreshold.message}</p>}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentItem(null);
                    reset();
                  }}
                  className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {currentItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Inventory Item Button */}
      <button
        onClick={() => {
          setCurrentItem(null);
          setIsModalOpen(true);
        }}
        className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus size={20} className="inline mr-2" />
        Add New Inventory Item
      </button>
    </div>
  );
};

export default Inventory;