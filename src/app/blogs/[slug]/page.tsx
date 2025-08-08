import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Blog } from "@/types/blog";
import { getBlogBySlug } from "@/utils/api";
import Image from "next/image";

async function getBlog(slug: string): Promise<Blog> {
  try {
    return await getBlogBySlug(slug);
  } catch (error) {
    console.error("Error fetching blog:", error);
    notFound();
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const blog = await getBlog(slug);

    // Ensure we have valid blog data
    if (!blog || !blog.title) {
      console.warn(`Blog data incomplete for slug: ${slug}`);
      return generateFallbackMetadata(slug);
    }

    return {
      title: blog.seo?.metaTitle || `${blog.title} | SATX Bounce Blog`,
      description:
        blog.seo?.metaDescription ||
        blog.excerpt ||
        (blog.introduction
          ? blog.introduction.substring(0, 160)
          : `Read about ${blog.title} on SATX Bounce Blog`),
      alternates: {
        canonical: `/blogs/${slug}`,
      },
      openGraph: {
        title: blog.title,
        description:
          blog.excerpt ||
          (blog.introduction
            ? blog.introduction.substring(0, 160)
            : `Read about ${blog.title}`),
        images: blog.featuredImage ? [blog.featuredImage] : [],
        type: "article",
        publishedTime: blog.publishDate,
        modifiedTime: blog.lastModified,
        tags: blog.tags || [],
      },
      keywords: blog.tags ? blog.tags.join(", ") : "",
    };
  } catch (error) {
    console.error(
      `Error generating metadata for blog slug: ${(await params).slug}`,
      error,
    );
    return generateFallbackMetadata((await params).slug);
  }
}

// Fallback metadata function to ensure title tag is always present
function generateFallbackMetadata(slug: string): Metadata {
  const fallbackTitle = `Blog Post | SATX Bounce`;
  const fallbackDescription =
    "Read our latest blog post about bounce house rentals and party planning tips in San Antonio.";

  return {
    title: fallbackTitle,
    description: fallbackDescription,
    alternates: {
      canonical: `/blogs/${slug}`,
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      type: "article",
    },
  };
}

export default async function BlogDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog || blog.status !== "published") {
    throw new Error("This blog post is not available");
  }

  // Ensure we have safe defaults for all data
  const safeCategories = blog.categories || [];
  const safeTags = blog.tags || [];
  const safeImages = blog.images || [];
  const safeMeta = blog.meta || { views: 0, likes: 0, shares: 0 };

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        <article className="bg-white rounded-xl shadow-lg p-8 mb-12">
          {blog.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <Image
                src={blog.featuredImage}
                alt={blog.title || "Blog post image"}
                width={1200}
                height={630}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {safeCategories.map((category: string) => (
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
              {blog.title || "Blog Post"} | SATX Bounce Blog
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
                <span>{safeMeta.views} views</span>
                <span>{safeMeta.likes} likes</span>
              </div>
            </div>
          </header>

          <div className="prose max-w-none text-gray-600 text-lg space-y-8">
            {blog.introduction && (
              <div className="mb-8">{blog.introduction}</div>
            )}

            {safeImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                {safeImages.map(
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
                        alt={`${blog.title || "Blog post"} image ${index + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ),
                )}
              </div>
            )}

            {blog.body && <div className="mb-8">{blog.body}</div>}

            {blog.conclusion && <div className="mb-8">{blog.conclusion}</div>}

            {safeTags.length > 0 && (
              <div className="border-t pt-6 mt-8">
                <div className="flex flex-wrap gap-2">
                  {safeTags.map((tag: string) => (
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
