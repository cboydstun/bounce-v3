"use client";

import { useState } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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

interface GeneratedEmail {
  subject: string;
  content: string;
  htmlContent: string;
}

interface KudosPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: EligibleCustomer;
  generatedEmail: GeneratedEmail;
  onEmailSent: (customerId: string) => void;
  onRegenerate: () => void;
}

export default function KudosPreviewModal({
  isOpen,
  onClose,
  customer,
  generatedEmail,
  onEmailSent,
  onRegenerate,
}: KudosPreviewModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(generatedEmail.subject);
  const [editedContent, setEditedContent] = useState(generatedEmail.content);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    setIsSending(true);

    try {
      const response = await fetch("/api/v1/admin/kudos/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customer.id,
          customerType: customer.type,
          subject: isEditing ? editedSubject : generatedEmail.subject,
          content: isEditing ? editedContent : generatedEmail.content,
          htmlContent: isEditing
            ? convertToHtml(editedContent)
            : generatedEmail.htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      toast.success("Kudos email sent successfully!");
      onEmailSent(customer.id);
    } catch (error) {
      console.error("Error sending email:", error);

      // Show more specific error messages
      let errorMessage = "Failed to send email";
      if (error instanceof Error) {
        if (error.message.includes("SendGrid authentication")) {
          errorMessage = "Email configuration error. Please contact support.";
        } else if (error.message.includes("verify your sender email")) {
          errorMessage = "Email sender not verified. Please contact support.";
        } else if (error.message.includes("SendGrid error")) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const convertToHtml = (text: string): string => {
    return text
      .split("\n\n")
      .map((paragraph) => `<p>${paragraph.trim()}</p>`)
      .join("\n")
      .replace(/\n/g, "<br>");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedSubject(generatedEmail.subject);
    setEditedContent(generatedEmail.content);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedSubject(generatedEmail.subject);
    setEditedContent(generatedEmail.content);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email Preview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Review and edit the generated email before sending
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">To:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {customer.customerName} &lt;{customer.customerEmail}&gt;
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Event: {formatDate(customer.eventDate)}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border rounded-lg overflow-hidden mb-6">
            {/* Email Header */}
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Subject:
                </span>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="mr-1 h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              ) : (
                <div className="mt-2 text-gray-900 font-medium">
                  {generatedEmail.subject}
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="p-4">
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-96 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Email content..."
                />
              ) : (
                <div className="prose max-w-none">
                  <div
                    className="whitespace-pre-wrap text-gray-900"
                    style={{ lineHeight: "1.6" }}
                  >
                    {generatedEmail.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              {!isEditing && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <ArrowPathIcon className="mr-2 h-4 w-4" />
                  Regenerate
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Email Preview Note */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This email will be sent from your
              configured admin email address and will include a call-to-action
              for the customer to leave a 5-star Google review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
