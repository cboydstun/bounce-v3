'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL, API_ROUTES } from '@/config/constants';
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Blog } from "@/types/blog";

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ROUTES.BLOGS}`);
        if (!response.ok) throw new Error("Failed to fetch blogs");
        const data = await response.json();
        setBlogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex justify-center items-center">
        <p className="text-red-500 font-semibold text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Our{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
              Blog Posts
            </span>
          </h1>
          <p className="text-white text-lg">
            Stay updated with our latest news and insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link
              key={blog._id}
              href={`/blogs/${blog.slug}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-secondary-blue/20"
            >
              {blog.featuredImage && (
                <div className="aspect-video overflow-hidden">
                  <Image
                    src={blog.featuredImage}
                    alt={blog.title}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold text-primary-blue mb-3 line-clamp-2">
                  {blog.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {blog.excerpt}
                </p>
                <div className="space-y-4">
                  {blog.categories && blog.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.categories.map((category, index) => (
                        <span
                          key={index}
                          className="text-xs bg-secondary-blue/5 text-primary-blue px-2 py-1 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {blog.publishDate ? new Date(blog.publishDate).toLocaleDateString() : "Unknown date"}
                      </span>
                      {blog.readTime && (
                        <>
                          <span>•</span>
                          <span className="font-medium bg-secondary-blue/10 text-primary-blue px-2 py-1 rounded-full">
                            {blog.readTime} min read
                          </span>
                        </>
                      )}
                    </div>
                    {blog.meta && (
                      <div className="flex items-center space-x-3 text-xs">
                        <span title="Views">{blog.meta.views} views</span>
                        <span title="Likes">{blog.meta.likes} likes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
