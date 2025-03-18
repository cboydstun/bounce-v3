import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductWithId } from "../../../types/product";
import { getProductBySlug } from "../../../utils/api";
import ContactForm from "../../../components/ContactForm";
import ImageGallery from "./ImageGallery";

async function getProduct(slug: string): Promise<ProductWithId> {
  try {
    return await getProductBySlug(slug);
  } catch (error) {
    console.error("Error fetching product:", error);
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
  const product = await getProduct(slug);

  const getSpecValue = (name: string) => {
    const spec = product.specifications.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    return spec?.value || "N/A";
  };

  return {
    title: `${product.name} | SATX Bounce House Rentals`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
    other: {
      "product:price:amount": product.price.base.toString(),
      keywords: `bounce house rental, ${product.name}, party rental, San Antonio, ${getSpecValue("capacity")}, ${getSpecValue("age range")}`,
    },
  };
}

export default async function ProductDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  const getSpecValue = (name: string) => {
    const spec = product.specifications.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    return spec?.value || "N/A";
  };

  return (
    <>
      <div className="w-full bg-secondary-blue/5 py-12">
        <div className="container mx-auto px-4">
          {/* Product Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Image Gallery */}
              <ImageGallery
                images={product.images}
                productName={product.name}
              />

              {/* Product Details */}
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-primary-purple mb-4">
                    {product.name}
                  </h1>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text mb-6">
                    ${product.price.base.toFixed(2)}
                  </p>
                  <div className="prose max-w-none text-gray-600 text-lg">
                    <p>{product.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-primary-blue">
                    Specifications
                  </h2>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.dimensions && (
                      <div className="bg-secondary-blue/5 p-4 rounded-lg">
                        <dt className="font-semibold text-primary-blue mb-1">
                          Dimensions
                        </dt>
                        <dd className="text-gray-600">
                          {product.dimensions.length} x{" "}
                          {product.dimensions.width} x{" "}
                          {product.dimensions.height} {product.dimensions.unit}
                        </dd>
                      </div>
                    )}
                    <div className="bg-secondary-blue/5 p-4 rounded-lg">
                      <dt className="font-semibold text-primary-blue mb-1">
                        Capacity
                      </dt>
                      <dd className="text-gray-600">
                        {getSpecValue("capacity")}
                      </dd>
                    </div>
                    <div className="bg-secondary-blue/5 p-4 rounded-lg">
                      <dt className="font-semibold text-primary-blue mb-1">
                        Age Range
                      </dt>
                      <dd className="text-gray-600">
                        {getSpecValue("age range")}
                      </dd>
                    </div>
                    <div className="bg-secondary-blue/5 p-4 rounded-lg">
                      <dt className="font-semibold text-primary-blue mb-1">
                        Rental Duration
                      </dt>
                      <dd className="text-gray-600 capitalize">
                        {product.rentalDuration}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-center text-primary-purple mb-8">
                Book {product.name}
              </h2>
              <ContactForm initialBouncerId={product._id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
