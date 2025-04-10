import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartyPackageWithId } from "../../../types/partypackage";
import { ProductWithId } from "../../../types/product";
import { getPartyPackageBySlug, getProducts } from "../../../utils/api";
import ContactForm from "../../../components/ContactForm";
import ItemsList from "./ItemsList";

// New interface to hold package data with product images
interface PartyPackageWithProductImages extends PartyPackageWithId {
  productImages: Record<string, string>; // Map of product ID to image URL
}

async function getPartyPackageWithProductImages(slug: string): Promise<PartyPackageWithProductImages> {
  try {
    // Get the party package
    let partyPackage: PartyPackageWithId;
    
    // Try both API client and direct fetch
    try {
      partyPackage = await getPartyPackageBySlug(slug);
    } catch (apiError) {
      console.error(`Page component: API client failed:`, apiError);

      // Use fetch directly as a fallback with absolute URL
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/v1/partypackages/${slug}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      partyPackage = await response.json();
    }
    
    // Get all products to find images for package items
    const productsData = await getProducts();
    const products = productsData.products || [];
    
    // Create a mapping of product IDs to their primary image URL
    const productImages: Record<string, string> = {};
    
    // First, create mappings using _id, slug, and name-based IDs
    products.forEach((product: ProductWithId) => {
      if (product.images && product.images.length > 0) {
        // Use both _id and slug as keys in the mapping to increase chances of a match
        productImages[product._id] = product.images[0].url;
        productImages[product.slug] = product.images[0].url;
        
        // Also try using the product name as a key (converted to lowercase and spaces replaced with hyphens)
        const nameAsId = product.name.toLowerCase().replace(/\s+/g, '-');
        productImages[nameAsId] = product.images[0].url;
      }
    });
    
    // Return the package with product images mapping
    return {
      ...partyPackage,
      productImages,
    };
  } catch (error) {
    console.error(
      `Page component: All attempts failed for slug ${slug}:`,
      error,
    );
    notFound();
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const partyPackage = await getPartyPackageWithProductImages(slug);

  return {
    title: `${partyPackage.name} | SATX Bounce House Rentals`,
    description: partyPackage.description,
    openGraph: {
      title: partyPackage.name,
      description: partyPackage.description,
      type: "website",
    },
    other: {
      "product:price:amount": partyPackage.packagePrice.toString(),
      keywords: `party package, ${partyPackage.name}, bounce house bundle, San Antonio, party rental package`,
    },
  };
}

export default async function PartyPackageDetail({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const partyPackage = await getPartyPackageWithProductImages(slug);

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <div className="mb-6">
          <a
            href="/party-packages"
            className="inline-flex items-center text-primary-blue hover:text-primary-purple transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to All Packages
          </a>
        </div>

        {/* Package Details Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-primary-purple mb-4">
                {partyPackage.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-2xl line-through text-gray-500">
                  ${partyPackage.totalRetailPrice.toFixed(2)}
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                  ${partyPackage.packagePrice.toFixed(2)}
                </p>
                <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium">
                  Save {partyPackage.savingsPercentage}%
                </span>
              </div>
              <div className="prose max-w-none text-gray-600 text-lg">
                <p>{partyPackage.description}</p>
              </div>
            </div>

            {/* Package Items */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-blue">
                What&apos;s Included
              </h2>
              <ItemsList 
                items={partyPackage.items} 
                productImages={partyPackage.productImages} 
              />
            </div>

            {/* Specifications */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-blue">
                Specifications
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary-blue/5 p-4 rounded-lg">
                  <dt className="font-semibold text-primary-blue mb-1">
                    Recommended Party Size
                  </dt>
                  <dd className="text-gray-600">
                    {partyPackage.recommendedPartySize.min}-
                    {partyPackage.recommendedPartySize.max} people
                  </dd>
                </div>
                <div className="bg-secondary-blue/5 p-4 rounded-lg">
                  <dt className="font-semibold text-primary-blue mb-1">
                    Age Range
                  </dt>
                  <dd className="text-gray-600">
                    {partyPackage.ageRange.min}+ years
                  </dd>
                </div>
                <div className="bg-secondary-blue/5 p-4 rounded-lg">
                  <dt className="font-semibold text-primary-blue mb-1">
                    Space Required
                  </dt>
                  <dd className="text-gray-600">
                    {partyPackage.spaceRequired}
                  </dd>
                </div>
                <div className="bg-secondary-blue/5 p-4 rounded-lg">
                  <dt className="font-semibold text-primary-blue mb-1">
                    Duration
                  </dt>
                  <dd className="text-gray-600 capitalize">
                    {partyPackage.duration}
                  </dd>
                </div>
                {partyPackage.powerRequired && (
                  <div className="bg-secondary-blue/5 p-4 rounded-lg">
                    <dt className="font-semibold text-primary-blue mb-1">
                      Power Required
                    </dt>
                    <dd className="text-gray-600">Yes</dd>
                  </div>
                )}
                {partyPackage.seasonalRestrictions && (
                  <div className="bg-secondary-blue/5 p-4 rounded-lg">
                    <dt className="font-semibold text-primary-blue mb-1">
                      Seasonal Restrictions
                    </dt>
                    <dd className="text-gray-600">
                      {partyPackage.seasonalRestrictions}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center text-primary-purple mb-8">
              Book {partyPackage.name}
            </h2>
            <ContactForm initialBouncerId={partyPackage.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
