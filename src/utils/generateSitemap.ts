import { writeFileSync } from "fs";
import { globby } from "globby";
import prettier from "prettier";
import axios from "axios";

interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

// Pages that should be excluded from the sitemap
const EXCLUDED_ROUTES = ["/debug-auth", "/paypal-test", "/login", "/admin"];

// Format date to ISO 8601 (YYYY-MM-DD) format
function formatDate(
  dateString: string | Date | undefined,
  fallback: string,
): string {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return fallback;

    return date.toISOString().split("T")[0];
  } catch (error) {
    console.warn(`Invalid date format: ${dateString}, using fallback`);
    console.error(error);
    return fallback;
  }
}

// Validate URL slug
function isValidSlug(slug: string | undefined): boolean {
  return Boolean(slug && slug !== "undefined" && slug.trim() !== "");
}

// Function to fetch all products
async function fetchProducts() {
  try {
    const response = await axios.get(
      "https://www.satxbounce.com/api/v1/products",
      {
        timeout: 10000, // 10 second timeout
      },
    );
    const data = response.data;
    const products = Array.isArray(data) ? data : data.products || [];

    // Log the number of products fetched
    console.log(`Fetched ${products.length} products for sitemap`);

    return products;
  } catch (error) {
    console.error("Error fetching products for sitemap:", error);
    return [];
  }
}

// Function to fetch all party packages
async function fetchPartyPackages() {
  try {
    const response = await axios.get(
      "https://www.satxbounce.com/api/v1/partypackages",
      {
        timeout: 10000, // 10 second timeout
      },
    );
    const data = response.data;
    const packages = Array.isArray(data) ? data : data.packages || [];

    // Log the number of packages fetched
    console.log(`Fetched ${packages.length} party packages for sitemap`);

    return packages;
  } catch (error) {
    console.error("Error fetching party packages for sitemap:", error);
    return [];
  }
}

// Function to fetch all blogs
async function fetchBlogs() {
  try {
    const response = await axios.get(
      "https://www.satxbounce.com/api/v1/blogs",
      {
        timeout: 10000, // 10 second timeout
      },
    );
    const data = response.data;

    // Handle different response formats
    let blogs = [];
    if (Array.isArray(data)) {
      blogs = data;
    } else if (data.blogs && Array.isArray(data.blogs)) {
      blogs = data.blogs;
    } else if (typeof data === "object" && data !== null) {
      const possibleBlogs = Object.values(data).find((val) =>
        Array.isArray(val),
      );
      if (possibleBlogs) {
        blogs = possibleBlogs;
      }
    }

    // Log the number of blogs fetched
    console.log(`Fetched ${blogs.length} blogs for sitemap`);

    return blogs;
  } catch (error) {
    console.error("Error fetching blogs for sitemap:", error);
    return [];
  }
}

async function generate() {
  try {
    const pageFiles = await globby([
      "src/app/**/page.tsx",
      "!src/app/admin/**",
      "!src/app/**/error.tsx",
      "!src/app/**/loading.tsx",
      "!src/app/**/_*.tsx",
    ]);

    const currentDate = new Date().toISOString().split("T")[0];

    // Convert file paths to URLs, excluding dynamic routes and excluded routes
    const dynamicUrls: SitemapUrl[] = pageFiles
      .filter((file) => !file.includes("[") && !file.includes("]")) // Exclude dynamic routes
      .map((file: string) => {
        // Remove src/app and page.tsx to get the route
        const route = file
          .replace("src/app", "")
          .replace("/page.tsx", "")
          .replace("/index", "");

        return {
          url: `https://www.satxbounce.com${route}`,
          lastmod: currentDate,
          changefreq: "weekly" as const,
          priority: 0.7,
        };
      })
      .filter((urlObj) => {
        // Filter out excluded routes
        return !EXCLUDED_ROUTES.some((excludedRoute) =>
          urlObj.url.startsWith(`https://www.satxbounce.com${excludedRoute}`),
        );
      });

    // Base URLs with higher priority overrides
    const staticUrls: SitemapUrl[] = [
      {
        url: "https://www.satxbounce.com",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 1.0,
      },
      {
        url: "https://www.satxbounce.com/about",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
      {
        url: "https://www.satxbounce.com/products",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 0.9,
      },
      {
        url: "https://www.satxbounce.com/contact",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
      {
        url: "https://www.satxbounce.com/blogs",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        url: "https://www.satxbounce.com/faq",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
    ];

    // Fetch dynamic product URLs
    const products = await fetchProducts();
    const productUrls = products
      .filter((product: any) => isValidSlug(product.slug))
      .map((product: any) => ({
        url: `https://www.satxbounce.com/products/${product.slug}`,
        lastmod: formatDate(product.updatedAt, currentDate),
        changefreq: "weekly" as const,
        priority: 0.8,
      }));

    // Fetch dynamic blog URLs
    const blogs = await fetchBlogs();
    const blogUrls = blogs
      .filter((blog: any) => isValidSlug(blog.slug))
      .map((blog: any) => ({
        url: `https://www.satxbounce.com/blogs/${blog.slug}`,
        lastmod: formatDate(blog.lastModified || blog.publishDate, currentDate),
        changefreq: "weekly" as const,
        priority: 0.7,
      }));

    // Fetch dynamic party package URLs
    const partyPackages = await fetchPartyPackages();
    const packageUrls = partyPackages
      .filter((pkg: any) => isValidSlug(pkg.slug))
      .map((pkg: any) => ({
        url: `https://www.satxbounce.com/party-packages/${pkg.slug}`,
        lastmod: formatDate(pkg.updatedAt, currentDate),
        changefreq: "weekly" as const,
        priority: 0.8,
      }));

    // Combine static and dynamic URLs, with static URLs taking precedence
    const allUrls = [...staticUrls];

    // Add product, blog, and party package URLs
    const dynamicProductAndBlogUrls = [
      ...productUrls,
      ...blogUrls,
      ...packageUrls,
    ];

    // Add dynamic page URLs and product/blog URLs that don't exist in static URLs
    [...dynamicUrls, ...dynamicProductAndBlogUrls].forEach(
      (dynamicUrl: SitemapUrl) => {
        if (!staticUrls.some((staticUrl) => staticUrl.url === dynamicUrl.url)) {
          allUrls.push(dynamicUrl);
        }
      },
    );

    // Log the number of URLs in each category
    console.log(`Static URLs: ${staticUrls.length}`);
    console.log(`Dynamic page URLs: ${dynamicUrls.length}`);
    console.log(`Product URLs: ${productUrls.length}`);
    console.log(`Blog URLs: ${blogUrls.length}`);
    console.log(`Party package URLs: ${packageUrls.length}`);

    const sitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allUrls
          .map(
            ({ url, lastmod, changefreq, priority }) => `
          <url>
            <loc>${url}</loc>
            <lastmod>${lastmod || currentDate}</lastmod>
            <changefreq>${changefreq}</changefreq>
            <priority>${priority}</priority>
          </url>
        `,
          )
          .join("")}
      </urlset>
    `;

    const formatted = await prettier.format(sitemap, {
      parser: "html",
    });

    writeFileSync("public/sitemap.xml", formatted);
    console.log(`Sitemap generated with ${allUrls.length} URLs`);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

generate();
