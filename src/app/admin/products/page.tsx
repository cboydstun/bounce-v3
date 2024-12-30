'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/utils/api';
import { API_BASE_URL, API_ROUTES } from '@/config/constants';
import { Product } from '@/types/product';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`${API_BASE_URL}${API_ROUTES.PRODUCTS}`);
        setProducts(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      await api.delete(`${API_BASE_URL}${API_ROUTES.PRODUCTS}/${slug}`);
      setProducts(products.filter(product => product.slug !== slug));
    } catch (err) {
      console.error('Delete error:', err);
      if (err instanceof Error && err.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: Product['price']) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency,
    }).format(price.base);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all products including their name, price, category, and status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/products/new"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Product
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
          {error.toLowerCase().includes('log in') && (
            <div className="mt-2">
              <Link
                href="/login"
                className="text-sm font-medium text-red-800 underline hover:text-red-600"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      )}
      
      {isLoading ? (
        <div className="mt-8 flex justify-center">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Category
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {product.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatPrice(product.price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {product.category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.availability === 'available' ? 'bg-green-100 text-green-800' : 
                            product.availability === 'rented' ? 'bg-blue-100 text-blue-800' :
                            product.availability === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.availability.charAt(0).toUpperCase() + product.availability.slice(1)}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/admin/products/${product.slug}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.slug)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isLoading}
                          >
                            {isLoading ? <LoadingSpinner className="w-4 h-4" /> : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
