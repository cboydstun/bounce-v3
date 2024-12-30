'use client';

import { useState, FormEvent } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface BlogFormData {
  title: string;
  slug: string;
  author: {
    _id: string;
    email: string;
  };
  introduction: string;
  body: string;
  conclusion: string;
  images: Array<{
    filename: string;
    url: string;
    public_id: string;
    mimetype?: string;
    size?: number;
  }>;
  excerpt?: string;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishDate?: Date;
  lastModified?: Date;
  comments?: Array<{
    user: string; // ObjectId reference
    content: string;
    date: Date;
    isApproved: boolean;
  }>;
  meta: {
    views: number;
    likes: number;
    shares: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
  };
  readTime?: number;
  isFeature: boolean;
  relatedPosts?: string[]; // Array of Blog ObjectIds
  createdAt?: Date;
  updatedAt?: Date;
}

interface BlogFormProps {
  initialData?: BlogFormData;
  onSubmit: (data: BlogFormData) => Promise<void>;
  isEdit?: boolean;
}

export default function BlogForm({ initialData, onSubmit, isEdit = false }: BlogFormProps) {
  const [formData, setFormData] = useState<BlogFormData>(
    initialData || {
      title: '',
      slug: '',
      author: {
        _id: '',
        email: ''
      },
      introduction: '',
      body: '',
      conclusion: '',
      images: [],
      excerpt: '',
      featuredImage: '',
      categories: [],
      tags: [],
      status: 'draft',
      publishDate: undefined,
      lastModified: undefined,
      comments: [],
      meta: {
        views: 0,
        likes: 0,
        shares: 0
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        focusKeyword: ''
      },
      readTime: 0,
      isFeature: false,
      relatedPosts: [],
      createdAt: undefined,
      updatedAt: undefined
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
          Title
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium leading-6 text-gray-900">
          Slug
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="author" className="block text-sm font-medium leading-6 text-gray-900">
          Author Email
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="author"
            value={formData.author?.email || 'No author assigned'}
            disabled
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label htmlFor="introduction" className="block text-sm font-medium leading-6 text-gray-900">
          Introduction
        </label>
        <div className="mt-2">
          <textarea
            id="introduction"
            rows={3}
            value={formData.introduction}
            onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium leading-6 text-gray-900">
          Body
        </label>
        <div className="mt-2">
          <textarea
            id="body"
            rows={10}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="conclusion" className="block text-sm font-medium leading-6 text-gray-900">
          Conclusion
        </label>
        <div className="mt-2">
          <textarea
            id="conclusion"
            rows={3}
            value={formData.conclusion}
            onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="categories" className="block text-sm font-medium leading-6 text-gray-900">
          Categories (comma-separated)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="categories"
            value={formData.categories.join(', ')}
            onChange={(e) => setFormData({ ...formData, categories: e.target.value.split(',').map(cat => cat.trim()) })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium leading-6 text-gray-900">
          Tags (comma-separated)
        </label>
        <div className="mt-2">
          <input
            type="text"
            id="tags"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()) })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
          Status
        </label>
        <div className="mt-2">
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="isFeature" className="block text-sm font-medium leading-6 text-gray-900">
          Featured Post
        </label>
        <div className="mt-2">
          <input
            type="checkbox"
            id="isFeature"
            checked={formData.isFeature}
            onChange={(e) => setFormData({ ...formData, isFeature: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isLoading ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : (
            isEdit ? 'Update Blog Post' : 'Create Blog Post'
          )}
        </button>
      </div>
    </form>
  );
}
