import { writeFileSync } from "fs";
import { globby } from "globby";
import prettier from "prettier";

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

    // Convert file paths to URLs, excluding dynamic routes
    const dynamicUrls: SitemapUrl[] = pageFiles
      .filter((file) => !file.includes("[") && !file.includes("]")) // Exclude dynamic routes
      .map((file: string) => {
        // Remove src/app and page.tsx to get the route
        const route = file
          .replace("src/app", "")
          .replace("/page.tsx", "")
          .replace("/index", "");

        return {
          url: `https://satxbounce.com${route}`,
          lastmod: currentDate,
          changefreq: "weekly",
          priority: 0.7,
        };
      });

    // Base URLs with higher priority overrides
    const staticUrls: SitemapUrl[] = [
      {
        url: "https://satxbounce.com",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 1.0,
      },
      {
        url: "https://satxbounce.com/about",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
      {
        url: "https://satxbounce.com/products",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 0.9,
      },
      {
        url: "https://satxbounce.com/contact",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
      {
        url: "https://satxbounce.com/blogs",
        lastmod: currentDate,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        url: "https://satxbounce.com/faq",
        lastmod: currentDate,
        changefreq: "monthly",
        priority: 0.8,
      },
    ];

    // TODO: Add dynamic product and blog URLs by fetching from your API
    // Example:
    // const products = await fetch('https://satxbounce.com/api/products').then(res => res.json());
    // const productUrls = products.map(product => ({
    //   url: `https://satxbounce.com/products/${product.slug}`,
    //   lastmod: product.updatedAt.split('T')[0],
    //   changefreq: 'weekly',
    //   priority: 0.8,
    // }));

    // Combine static and dynamic URLs, with static URLs taking precedence
    const allUrls = [...staticUrls];

    // Only add dynamic URLs that don't exist in static URLs
    dynamicUrls.forEach((dynamicUrl: SitemapUrl) => {
      if (!staticUrls.some((staticUrl) => staticUrl.url === dynamicUrl.url)) {
        allUrls.push(dynamicUrl);
      }
    });

    const sitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${allUrls
          .map(
            ({ url, lastmod, changefreq, priority }) => `
          <url>
            <loc>${url}</loc>
            <lastmod>${lastmod}</lastmod>
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
    console.log("Sitemap generated successfully!");
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

generate();
