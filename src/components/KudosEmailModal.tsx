"use client";

import { useState } from "react";
import {
  XMarkIcon,
  HeartIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import KudosPreviewModal from "@/components/KudosPreviewModal";
import toast from "react-hot-toast";

interface EligibleCustomer {
  id: string;
  type: "order" | "contact";
  customerName: string;
  customerEmail: string;
  eventDate: string;
  rentalItems: string[];
  kudosEmailSent: boolean;
  kudosEmailSentAt?: string;
  createdAt: string;
}

interface KudosEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: EligibleCustomer;
  onEmailSent: (customerId: string) => void;
}

interface GeneratedEmail {
  subject: string;
  content: string;
  htmlContent: string;
}

export default function KudosEmailModal({
  isOpen,
  onClose,
  customer,
  onEmailSent,
}: KudosEmailModalProps) {
  const [positiveComment1, setPositiveComment1] = useState("");
  const [positiveComment2, setPositiveComment2] = useState("");
  const [positiveComment3, setPositiveComment3] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!positiveComment1.trim()) {
      newErrors.push("First positive comment is required");
    } else if (positiveComment1.length > 200) {
      newErrors.push("First positive comment must be 200 characters or less");
    }

    if (!positiveComment2.trim()) {
      newErrors.push("Second positive comment is required");
    } else if (positiveComment2.length > 200) {
      newErrors.push("Second positive comment must be 200 characters or less");
    }

    if (!positiveComment3.trim()) {
      newErrors.push("Third positive comment is required");
    } else if (positiveComment3.length > 200) {
      newErrors.push("Third positive comment must be 200 characters or less");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleGenerateEmail = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setErrors([]);

    try {
      const response = await fetch("/api/v1/admin/kudos/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          eventDate: customer.eventDate,
          rentalItems: customer.rentalItems,
          positiveComment1: positiveComment1.trim(),
          positiveComment2: positiveComment2.trim(),
          positiveComment3: positiveComment3.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate email");
      }

      const data = await response.json();
      setGeneratedEmail(data.data);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate email",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailSent = (customerId: string) => {
    onEmailSent(customerId);
    handleClose();
  };

  const handleClose = () => {
    setPositiveComment1("");
    setPositiveComment2("");
    setPositiveComment3("");
    setGeneratedEmail(null);
    setShowPreview(false);
    setErrors([]);
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />

          <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <HeartIcon className="mr-2 h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  New Kudos Email
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Customer Information */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">
                    {customer.customerName}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">
                    {customer.customerEmail}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Event Date:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(customer.eventDate)}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">
                    Rental Items:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {customer.rentalItems.join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Positive Comments Form */}
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900">
                Share positive comments about this customer:
              </h3>

              <div>
                <label
                  htmlFor="comment1"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  What made this customer special? *
                </label>
                <textarea
                  id="comment1"
                  value={positiveComment1}
                  onChange={(e) => setPositiveComment1(e.target.value)}
                  placeholder="e.g., They were so welcoming and organized..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {positiveComment1.length}/200 characters
                </div>
              </div>

              <div>
                <label
                  htmlFor="comment2"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Highlight a positive moment from their event *
                </label>
                <textarea
                  id="comment2"
                  value={positiveComment2}
                  onChange={(e) => setPositiveComment2(e.target.value)}
                  placeholder="e.g., The kids had an absolute blast on the bounce house..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {positiveComment2.length}/200 characters
                </div>
              </div>

              <div>
                <label
                  htmlFor="comment3"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  What would you like to thank them for? *
                </label>
                <textarea
                  id="comment3"
                  value={positiveComment3}
                  onChange={(e) => setPositiveComment3(e.target.value)}
                  placeholder="e.g., They took great care of our equipment..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {positiveComment3.length}/200 characters
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateEmail}
                disabled={isGenerating}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="mr-2 h-4 w-4" />
                    Generate Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {generatedEmail && (
        <KudosPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          customer={customer}
          generatedEmail={generatedEmail}
          onEmailSent={handleEmailSent}
          onRegenerate={() => {
            setShowPreview(false);
            setGeneratedEmail(null);
          }}
        />
      )}
    </>
  );
}
