'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/utils/api';
import {Blog} from '@/types/blog';
import { API_BASE_URL, API_ROUTES } from '@/config/constants';


export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch blogs on component mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`${API_BASE_URL}${API_ROUTES.BLOGS}`);
        setBlogs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await api.delete(`${API_BASE_URL}${API_ROUTES.BLOGS}/${slug}`);
      setBlogs(blogs.filter(blog => blog.slug !== slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && blogs.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error && blogs.length === 0) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 text-indigo-600 hover:text-indigo-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Blogs</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all blog posts including their title, status, and publish date.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/admin/blogs/new"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Blog Post
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          Error: {error}
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
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Published Date
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {blogs.map((blog) => (
                    <tr key={blog._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {blog.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          blog.status === 'published' ? 'bg-green-100 text-green-800' : 
                          blog.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {blog.publishDate ? new Date(blog.publishDate).toLocaleDateString() : 'Not published'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/blogs/${blog.slug}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.slug)}
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
