'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { API_BASE_URL, API_ROUTES } from '@/config/constants';

interface Contact {
  id: string;
  bouncer: string;
  email: string;
  phone?: string;
  partyDate: string;
  partyZipCode: string;
  message?: string;
  confirmed: boolean;
  createdAt: string;
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

export default function AdminContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE_URL}${API_ROUTES.CONTACTS}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }

        const data = await response.json();
        interface ApiContact {
          _id: string;
          bouncer: string;
          email: string;
          phone?: string;
          partyDate: string;
          partyZipCode: string;
          message?: string;
          confirmed: boolean;
          createdAt: string;
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
        setContacts(data.map((contact: ApiContact) => ({
          id: contact._id,
          bouncer: contact.bouncer,
          email: contact.email,
          phone: contact.phone,
          partyDate: contact.partyDate,
          partyZipCode: contact.partyZipCode,
          message: contact.message,
          confirmed: contact.confirmed,
          createdAt: contact.createdAt,
          tablesChairs: contact.tablesChairs,
          generator: contact.generator,
          popcornMachine: contact.popcornMachine,
          cottonCandyMachine: contact.cottonCandyMachine,
          snowConeMachine: contact.snowConeMachine,
          margaritaMachine: contact.margaritaMachine,
          slushyMachine: contact.slushyMachine,
          overnight: contact.overnight,
          sourcePage: contact.sourcePage
        })));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        console.error('Error fetching contacts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [router]);

  const handleUpdateStatus = async (id: string, confirmed: boolean) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ROUTES.CONTACTS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmed })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      setContacts(contacts.map(contact => 
        contact.id === id ? { ...contact, confirmed } : contact
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update status');
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact request?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ROUTES.CONTACTS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      setContacts(contacts.filter(contact => contact.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete contact');
      console.error('Error deleting contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (confirmed: boolean) => {
    return confirmed 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Contact Requests</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all contact requests including customer details and current status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0">
          <Link
            href="/admin/contacts/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            New Contact
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Bouncer Info
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Party Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Extras
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Confirmed
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">{contact.bouncer}</div>
                        <div className="text-gray-500">{contact.email}</div>
                        <div className="text-gray-500">{contact.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <div>Date: {new Date(contact.partyDate).toLocaleDateString()}</div>
                        <div>Zip: {contact.partyZipCode}</div>
                        {contact.message && (
                          <div className="max-w-xs overflow-hidden text-ellipsis">
                            Note: {contact.message}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        <ul>
                          {contact.tablesChairs && <li>Tables & Chairs</li>}
                          {contact.generator && <li>Generator</li>}
                          {contact.popcornMachine && <li>Popcorn Machine</li>}
                          {contact.cottonCandyMachine && <li>Cotton Candy Machine</li>}
                          {contact.snowConeMachine && <li>Snow Cone Machine</li>}
                          {contact.margaritaMachine && <li>Margarita Machine</li>}
                          {contact.slushyMachine && <li>Slushy Machine</li>}
                          {contact.overnight && <li>Overnight</li>}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select
                          value={contact.confirmed.toString()}
                          onChange={(e) => handleUpdateStatus(contact.id, e.target.value === 'true')}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.confirmed)}`}
                          disabled={isLoading}
                        >
                          <option value="false">Pending</option>
                          <option value="true">Confirmed</option>
                        </select>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/contacts/${contact.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(contact.id)}
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
    </div>
  );
}
