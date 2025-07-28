import { ProductWithId } from "@/types/product";

/**
 * Recursively converts MongoDB ObjectIds to strings and removes non-serializable properties
 */
function serializeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj;
  }

  // Handle MongoDB ObjectId (has _bsontype or buffer property)
  if (
    obj &&
    typeof obj === "object" &&
    (obj._bsontype === "ObjectId" || obj.buffer)
  ) {
    return obj.toString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeObject);
  }

  // Handle plain objects
  if (typeof obj === "object") {
    const serialized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip MongoDB internal fields
      if (key === "__v" || key === "$__" || key === "$isNew") {
        continue;
      }

      // Recursively serialize nested objects
      serialized[key] = serializeObject(value);
    }

    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Serializes a product object for safe passage from Server to Client components
 */
export function serializeProduct(product: any): ProductWithId {
  const serialized = serializeObject(product);

  // Ensure required fields are properly formatted
  return {
    ...serialized,
    _id: serialized._id?.toString() || serialized._id,
    createdAt: serialized.createdAt
      ? new Date(serialized.createdAt)
      : new Date(),
    updatedAt: serialized.updatedAt
      ? new Date(serialized.updatedAt)
      : new Date(),
  } as ProductWithId;
}

/**
 * Serializes an array of products
 */
export function serializeProducts(products: any[]): ProductWithId[] {
  return products.map(serializeProduct);
}
