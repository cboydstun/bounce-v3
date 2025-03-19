import { API_BASE_URL, API_ROUTES } from "@/config/constants";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Blog } from "@/types/blog";
import Image from "next/image";

async function getBlog(slug: string): Promise<Blog> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ROUTES.BLOGS}/${slug}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch blog: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw error;
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);

  return {
    title: blog.seo?.metaTitle || `${blog.title} | Blog`,
    description:
      blog.seo?.metaDescription ||
      blog.excerpt ||
      blog.introduction.substring(0, 160),
    openGraph: {
      title: blog.title,
      description: blog.excerpt || blog.introduction.substring(0, 160),
      images: blog.featuredImage ? [blog.featuredImage] : [],
      type: "article",
      publishedTime: blog.publishDate,
      modifiedTime: blog.lastModified,
      tags: blog.tags,
    },
    keywords: blog.tags.join(", "),
  };
}

export default async function BlogDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (blog.status !== "published") {
    throw new Error("This blog post is not available");
  }

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        <article className="bg-white rounded-xl shadow-lg p-8 mb-12">
          {blog.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                width={1200}
                height={630}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {blog.categories.map((category: string) => (
                <a
                  key={category}
                  href={`/blogs?category=${encodeURIComponent(category)}`}
                  className="bg-primary-purple/10 text-primary-purple px-3 py-1 rounded-full text-sm hover:bg-primary-purple/20 transition-colors"
                >
                  {category}
                </a>
              ))}
            </div>
            <h1 className="text-4xl font-bold text-primary-purple mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {blog.publishDate &&
                    new Date(blog.publishDate).toLocaleDateString()}
                </span>
                {blog.readTime && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-medium bg-secondary-blue/10 text-primary-blue px-2 py-1 rounded-full">
                      {blog.readTime} min read
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>{blog.meta.views} views</span>
                <span>{blog.meta.likes} likes</span>
              </div>
            </div>
          </header>

          <div className="prose max-w-none text-gray-600 text-lg space-y-8">
            <div className="mb-8">{blog.introduction}</div>

            {blog.images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                {blog.images.map(
                  (
                    image: { public_id: string; url: string },
                    index: number,
                  ) => (
                    <div
                      key={image.public_id}
                      className="rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image.url}
                        alt={`${blog.title} image ${index + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="mb-8">{blog.body}</div>

            <div className="mb-8">{blog.conclusion}</div>

            {blog.tags.length > 0 && (
              <div className="border-t pt-6 mt-8">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag: string) => (
                    <a
                      key={tag}
                      href={`/blogs?tag=${encodeURIComponent(tag)}`}
                      className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
