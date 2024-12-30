'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { API_BASE_URL, API_ROUTES } from '@/config/constants';

interface ContactFormData {
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed: boolean;
  tablesChairs?: boolean;
  generator?: boolean;
  popcornMachine?: boolean;
  cottonCandyMachine?: boolean;
  snowConeMachine?: boolean;
  margaritaMachine?: boolean;
  slushyMachine?: boolean;
  overnight?: boolean;
  sourcePage: string;
}

export default function NewContact() {
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>({
    bouncer: '',
    email: '',
    phone: '',
    partyDate: '',
    partyZipCode: '',
    message: '',
    confirmed: false,
    tablesChairs: false,
    generator: false,
    popcornMachine: false,
    cottonCandyMachine: false,
    snowConeMachine: false,
    overnight: false,
    margaritaMachine: false,
    slushyMachine: false,
    sourcePage: 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ROUTES.CONTACTS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to create contact');
      }

      router.push('/admin/contacts');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create contact');
      console.error('Error creating contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">New Contact Request</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bouncer Name
              <input
                type="text"
                name="bouncer"
                value={formData.bouncer}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Party Date
              <input
                type="date"
                name="partyDate"
                value={formData.partyDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Party Zip Code
              <input
                type="text"
                name="partyZipCode"
                value={formData.partyZipCode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
              <select
                name="confirmed"
                value={formData.confirmed.toString()}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="false">Pending</option>
                <option value="true">Confirmed</option>
              </select>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Message
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="tablesChairs"
                checked={formData.tablesChairs}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Tables & Chairs</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="generator"
                checked={formData.generator}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Generator</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="popcornMachine"
                checked={formData.popcornMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Popcorn Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="cottonCandyMachine"
                checked={formData.cottonCandyMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Cotton Candy Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="snowConeMachine"
                checked={formData.snowConeMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Snow Cone Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="margaritaMachine"
                checked={formData.margaritaMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Margarita Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="slushyMachine"
                checked={formData.slushyMachine}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Slushy Machine</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="overnight"
                checked={formData.overnight}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Overnight</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? <LoadingSpinner className="w-5 h-5" /> : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}
