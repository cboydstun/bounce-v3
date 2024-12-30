'use client';

import { useState } from 'react';
import { Image as ProductImage } from '../../../types/product';
import Image from 'next/image';

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]?.url || null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden shadow-lg">
        <Image
          src={selectedImage || images[0]?.url}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          width={800}
          height={600}
          priority={true}
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image.url)}
              className={`rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                selectedImage === image.url
                  ? "ring-2 ring-primary-blue"
                  : "ring-2 ring-transparent"
              }`}
            >
              <Image
                src={image.url}
                alt={`${productName} view ${index + 1}`}
                className="w-full h-24 object-cover"
                width={96}
                height={96}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
