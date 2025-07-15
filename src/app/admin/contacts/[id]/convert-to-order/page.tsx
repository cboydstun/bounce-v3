"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  getContactById,
  createOrderFromContact,
  getProducts,
} from "@/utils/api";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order";
import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";
import {
  DEFAULT_DELIVERY_FEE,
  DEFAULT_DISCOUNT_AMOUNT,
  DEFAULT_DEPOSIT_AMOUNT,
  DEFAULT_ORDER_STATUS,
  DEFAULT_PAYMENT_STATUS,
  DEFAULT_PAYMENT_METHOD,
  calculateOrderPricing,
} from "@/config/orderConstants";

interface OrderItem {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderFormData {
  contactId: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryFee: number;
  processingFee: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  tasks?: string[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConvertContactToOrder({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const [contact, setContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    contactId: "",
    items: [],
    subtotal: 0,
    taxAmount: 0,
    discountAmount: DEFAULT_DISCOUNT_AMOUNT,
    deliveryFee: DEFAULT_DELIVERY_FEE,
    processingFee: 0,
    totalAmount: 0,
    depositAmount: DEFAULT_DEPOSIT_AMOUNT,
    balanceDue: 0,
    status: DEFAULT_ORDER_STATUS,
    paymentStatus: DEFAULT_PAYMENT_STATUS,
    paymentMethod: DEFAULT_PAYMENT_METHOD,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [newItemType, setNewItemType] = useState<string>("bouncer");
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Get the NextAuth session
  const { status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check for missing required fields
  const validateRequiredFields = useCallback(() => {
    const missing: string[] = [];

    // Check if contact has required fields
    if (contact) {
      if (!contact.streetAddress) missing.push("Street Address");
      if (!contact.partyStartTime) missing.push("Party Start Time");
    }

    setMissingFields(missing);
    return missing.length === 0;
  }, [contact]);

  useEffect(() => {
    // Only fetch contact if authenticated
    if (status !== "authenticated") return;

    const fetchContact = async () => {
      try {
        setIsLoading(true);

        // Use the getContactById function from the API client
        const contactData = await getContactById(resolvedParams.id);

        // Check if contact is already converted
        if (contactData.confirmed === "Converted") {
          setError("This contact has already been converted to an order");
          setContact(contactData);
          return;
        }

        setContact(contactData);

        // Initialize form data with contact information
        const initialItems: OrderItem[] = [];

        // Add bouncer as an item if it exists
        if (contactData.bouncer) {
          initialItems.push({
            type: "bouncer",
            name: contactData.bouncer,
            quantity: 1,
            unitPrice: 0, // Admin will need to set the price
            totalPrice: 0,
          });
        }

        // Add extras as items if they exist
        const extras = [
          { field: "tablesChairs", name: "Tables & Chairs" },
          { field: "generator", name: "Generator" },
          { field: "popcornMachine", name: "Popcorn Machine" },
          { field: "cottonCandyMachine", name: "Cotton Candy Machine" },
          { field: "snowConeMachine", name: "Snow Cone Machine" },
          { field: "basketballShoot", name: "Basketball Shoot" },
          { field: "slushyMachine", name: "Slushy Machine" },
          { field: "overnight", name: "Overnight Rental" },
        ];

        extras.forEach((extra) => {
          if (contactData[extra.field as keyof Contact]) {
            initialItems.push({
              type: "extra",
              name: extra.name,
              quantity: 1,
              unitPrice: 0, // Admin will need to set the price
              totalPrice: 0,
            });
          }
        });

        setFormData((prev) => ({
          ...prev,
          contactId: resolvedParams.id,
          items: initialItems,
          notes: contactData.message || "",
        }));

        // Fetch product prices for the items
        await fetchProductPrices(initialItems);
      } catch (error) {
        // Handle authentication errors
        if (
          error instanceof Error &&
          (error.message.includes("401") ||
            error.message.includes("Authentication failed"))
        ) {
          console.error("Authentication error in fetchContact:", error);
          // Redirect to login page
          router.push("/login");
          return;
        }

        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error fetching contact:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [resolvedParams.id, router, status]);

  // Function to fetch product prices and update items
  const fetchProductPrices = async (items: OrderItem[]) => {
    try {
      setIsLoadingProducts(true);

      // Map of extra field names to their display names
      const extraNameMap: Record<string, string> = {
        tablesChairs: "Tables & Chairs",
        generator: "Generator",
        popcornMachine: "Popcorn Machine",
        cottonCandyMachine: "Cotton Candy Machine",
        snowConeMachine: "Snow Cone Machine",
        basketballShoot: "Basketball Shoot",
        slushyMachine: "Slushy Machine",
        overnight: "Overnight Rental",
      };

      // Create a list of product names to search for
      const productNames = items.map((item) => item.name);

      // Fetch products that match these names
      const productsResponse = await getProducts();
      const products = productsResponse.products || [];

      // Create a map of product names to prices
      const productPriceMap = new Map();
      products.forEach((product: ProductWithId) => {
        productPriceMap.set(product.name, product.price.base);

        // Also map display names of extras to their prices
        Object.values(extraNameMap).forEach((displayName) => {
          if (product.name.includes(displayName)) {
            productPriceMap.set(displayName, product.price.base);
          }
        });
      });

      // Update items with prices from products
      const updatedItems = items.map((item) => {
        const price = productPriceMap.get(item.name);
        if (price) {
          return {
            ...item,
            unitPrice: price,
            totalPrice: price * item.quantity,
          };
        }
        return item;
      });

      // Calculate totals using centralized utility
      const pricing = calculateOrderPricing(
        updatedItems,
        formData.deliveryFee,
        formData.discountAmount,
        formData.depositAmount,
      );

      // Update form data with new items and calculated values
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
        ...pricing,
      }));
    } catch (error) {
      console.error("Error fetching product prices:", error);
      // Don't set an error message, just log it
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Check if authenticated
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    e.preventDefault();

    // Reset error and success messages
    setError(null);
    setSuccess(null);

    // Check if contact has required fields
    const isValid = validateRequiredFields();
    if (!isValid) {
      setError(
        `Contact is missing required fields: ${missingFields.join(", ")}. Please update the contact with this information before converting to an order.`,
      );
      return;
    }

    // Validate form data
    if (formData.items.length === 0) {
      setError("Order must contain at least one item");
      return;
    }

    // Check if all items have prices
    const invalidItems = formData.items.filter(
      (item) => item.unitPrice <= 0 || item.totalPrice <= 0,
    );
    if (invalidItems.length > 0) {
      setError("All items must have valid prices");
      return;
    }

    try {
      setIsLoading(true);

      // Use the createOrderFromContact function from the API client
      const order = await createOrderFromContact(resolvedParams.id, formData);

      // Show success message
      setSuccess(
        `Order created successfully! Order number: ${order.orderNumber}`,
      );

      // Wait a moment before redirecting
      setTimeout(() => {
        // Navigate back to orders list
        router.push("/admin/orders");
        router.refresh();
      }, 2000);
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to create order",
      );
      console.error("Error creating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseFloat(value)
            : value,
    }));
  };

  const handleItemPriceChange = (
    index: number,
    field: "unitPrice" | "quantity",
    value: number,
  ) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index][field] = value;
      updatedItems[index].totalPrice =
        updatedItems[index].unitPrice * updatedItems[index].quantity;

      const pricing = calculateOrderPricing(
        updatedItems,
        prev.deliveryFee,
        prev.discountAmount,
        prev.depositAmount,
      );

      return {
        ...prev,
        items: updatedItems,
        ...pricing,
      };
    });
  };

  const handleAddItem = () => {
    if (!newItemName || newItemUnitPrice <= 0 || newItemQuantity <= 0) {
      setError("Please fill in all item fields with valid values");
      return;
    }

    const newItem: OrderItem = {
      type: newItemType,
      name: newItemName,
      description: newItemDescription || undefined,
      quantity: newItemQuantity,
      unitPrice: newItemUnitPrice,
      totalPrice: newItemQuantity * newItemUnitPrice,
    };

    setFormData((prev) => {
      const updatedItems = [...prev.items, newItem];
      const pricing = calculateOrderPricing(
        updatedItems,
        prev.deliveryFee,
        prev.discountAmount,
        prev.depositAmount,
      );

      return {
        ...prev,
        items: updatedItems,
        ...pricing,
      };
    });

    // Reset new item fields
    setNewItemType("bouncer");
    setNewItemName("");
    setNewItemDescription("");
    setNewItemQuantity(1);
    setNewItemUnitPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const pricing = calculateOrderPricing(
        updatedItems,
        prev.deliveryFee,
        prev.discountAmount,
        prev.depositAmount,
      );

      return {
        ...prev,
        items: updatedItems,
        ...pricing,
      };
    });
  };

  const handleUpdatePricing = () => {
    setFormData((prev) => {
      const pricing = calculateOrderPricing(
        prev.items,
        prev.deliveryFee,
        prev.discountAmount,
        prev.depositAmount,
      );

      return {
        ...prev,
        ...pricing,
      };
    });
  };

  const handleAddTask = () => {
    const taskInput = document.getElementById("new-task") as HTMLInputElement;
    const taskValue = taskInput.value.trim();

    if (!taskValue) return;

    setFormData((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), taskValue],
    }));

    taskInput.value = "";
  };

  const handleRemoveTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks?.filter((_, i) => i !== index),
    }));
  };

  // Show loading spinner when session is loading or when fetching contact or products
  if (status === "loading" || isLoading || isLoadingProducts) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect in useEffect)
  if (status !== "authenticated") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please log in to access this page...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Convert Contact to Order</h1>

      {contact && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-blue-800 mb-2">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name/Email</p>
              <p className="text-sm text-gray-900">{contact.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-sm text-gray-900">{contact.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Party Date</p>
              <p className="text-sm text-gray-900">
                {new Date(contact.partyDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Zip Code</p>
              <p className="text-sm text-gray-900">{contact.partyZipCode}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Message</p>
              <p className="text-sm text-gray-900">
                {contact.message || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {missingFields.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
          <p className="font-medium">Contact is missing required fields:</p>
          <ul className="list-disc list-inside mt-2">
            {missingFields.map((field, index) => (
              <li key={index}>{field}</li>
            ))}
          </ul>
          <p className="mt-2">
            Please update the contact with this information before converting to
            an order.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Order Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Paid">Paid</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Status
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Authorized">Authorized</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Partially Refunded">Partially Refunded</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                  <option value="quickbooks">QuickBooks</option>
                  <option value="free">Free</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Order Items</h2>

          {/* Existing Items */}
          {formData.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Items from Contact</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Unit Price
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4"
                      ></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
                          {item.type.charAt(0).toUpperCase() +
                            item.type.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {item.name}
                          {item.description && (
                            <div className="text-xs text-gray-400">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemPriceChange(
                                index,
                                "quantity",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemPriceChange(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value),
                              )
                            }
                            className={`w-24 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                              item.unitPrice <= 0
                                ? "border-yellow-500 bg-yellow-50"
                                : "border-gray-300"
                            }`}
                          />
                          {item.unitPrice <= 0 && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Please set a price
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ${item.totalPrice.toFixed(2)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add New Item */}
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Add Additional Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="bouncer">Bouncer</option>
                    <option value="extra">Extra</option>
                    <option value="add-on">Add-on</option>
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                  <input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    value={newItemQuantity}
                    onChange={(e) =>
                      setNewItemQuantity(parseInt(e.target.value))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Price
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItemUnitPrice}
                    onChange={(e) =>
                      setNewItemUnitPrice(parseFloat(e.target.value))
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subtotal
                <input
                  type="number"
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tax Amount (8.25%)
                <input
                  type="number"
                  name="taxAmount"
                  value={formData.taxAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  step="0.01"
                  min="0"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Amount
                <input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Fee
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Processing Fee (3% of subtotal)
                <input
                  type="number"
                  name="processingFee"
                  value={formData.processingFee}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Amount
                <input
                  type="number"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Deposit Amount
                <input
                  type="number"
                  name="depositAmount"
                  value={formData.depositAmount}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  onBlur={handleUpdatePricing}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Balance Due
                <input
                  type="number"
                  name="balanceDue"
                  value={formData.balanceDue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                  readOnly
                />
              </label>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>

            {/* Tasks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tasks
              </label>

              {/* Existing Tasks */}
              {formData.tasks && formData.tasks.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {formData.tasks.map((task, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-sm text-gray-700">{task}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add Task */}
              <div className="flex items-center">
                <input
                  type="text"
                  id="new-task"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="New Task"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Convert to Order
          </button>
        </div>
      </form>
    </div>
  );
}
