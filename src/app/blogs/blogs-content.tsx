"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL, API_ROUTES } from "@/config/constants";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Blog } from "@/types/blog";

export function BlogsContent() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  // Handle URL parameters on component mount
  useEffect(() => {
    // Check for URL parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get("category");
      const tagParam = urlParams.get("tag");
      const searchParam = urlParams.get("search");

      if (categoryParam) setCategory(categoryParam);
      if (tagParam) setTag(tagParam);
      if (searchParam) {
        setSearch(searchParam);
        setSearchInput(searchParam);
      }
    }
  }, []);

  // Fetch blogs when filters change
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (tag) params.append("tag", tag);
        if (search) params.append("search", search);

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const response = await fetch(
          `${API_BASE_URL}${API_ROUTES.BLOGS}${queryString}`,
        );

        if (!response.ok) throw new Error("Failed to fetch blogs");

        const data = await response.json();

        // Handle different response formats
        let blogsList: Blog[] = [];
        if (Array.isArray(data)) {
          // If the API returns an array directly
          blogsList = data;
        } else if (data.blogs && Array.isArray(data.blogs)) {
          // If the API returns an object with a blogs property
          blogsList = data.blogs;
        } else if (typeof data === "object" && data !== null) {
          // If the API returns some other object, try to extract blogs
          const possibleBlogs = Object.values(data).find((val) =>
            Array.isArray(val),
          );
          if (possibleBlogs) {
            blogsList = possibleBlogs as Blog[];
          }
        }

        setBlogs(blogsList);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [category, tag, search]);

  // Update URL with current filters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (tag) params.append("tag", tag);
      if (search) params.append("search", search);

      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");

      // Update URL without reloading the page
      window.history.pushState({ path: newUrl }, "", newUrl);
    }
  }, [category, tag, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCategoryClick = (selectedCategory: string) => {
    setCategory((prev) =>
      prev === selectedCategory ? null : selectedCategory,
    );
    setTag(null); // Reset tag when category changes
    setSearch(""); // Reset search when category changes
    setSearchInput(""); // Reset search input when category changes
  };

  const handleTagClick = (selectedTag: string) => {
    setTag((prev) => (prev === selectedTag ? null : selectedTag));
    setCategory(null); // Reset category when tag changes
    setSearch(""); // Reset search when tag changes
    setSearchInput(""); // Reset search input when tag changes
  };

  const clearFilters = () => {
    setCategory(null);
    setTag(null);
    setSearch("");
    setSearchInput("");
  };

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
        <div className="text-center mb-8">
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

        {/* Search and filter section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex mb-6">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search blogs..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <button
              type="submit"
              className="bg-primary-blue text-white px-6 py-2 rounded-r-lg hover:bg-primary-blue/90 transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-700 font-medium">Active filters:</span>
            {category && (
              <span className="bg-primary-blue/10 text-primary-blue px-3 py-1 rounded-full text-sm flex items-center">
                Category: {category}
                <button
                  onClick={() => setCategory(null)}
                  className="ml-2 text-primary-blue hover:text-primary-blue/70"
                >
                  ✕
                </button>
              </span>
            )}
            {tag && (
              <span className="bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full text-sm flex items-center">
                Tag: {tag}
                <button
                  onClick={() => setTag(null)}
                  className="ml-2 text-primary-purple hover:text-primary-purple/70"
                >
                  ✕
                </button>
              </span>
            )}
            {search && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center">
                Search: {search}
                <button
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                  }}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </span>
            )}
            {(category || tag || search) && (
              <button
                onClick={clearFilters}
                className="text-red-500 hover:text-red-700 text-sm ml-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {blogs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">
              No blogs found matching your criteria.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
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
                          {blog.categories.map((categoryName, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.preventDefault(); // Prevent the Link navigation
                                handleCategoryClick(categoryName);
                              }}
                              className="text-xs bg-secondary-blue/5 text-primary-blue px-2 py-1 rounded-full hover:bg-secondary-blue/10 transition-colors cursor-pointer"
                            >
                              {categoryName}
                            </button>
                          ))}
                        </div>
                      )}

                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {blog.tags.map((tagName, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.preventDefault(); // Prevent the Link navigation
                                handleTagClick(tagName);
                              }}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              #{tagName}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4 mt-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {blog.publishDate
                              ? new Date(blog.publishDate).toLocaleDateString()
                              : "Unknown date"}
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
          </>
        )}
      </div>
    </div>
  );
}
