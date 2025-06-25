"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface RecipientData {
  email: string;
  name: string;
  source: "contacts" | "orders" | "promoOptins";
  sourceId: string;
  consentStatus: boolean;
  lastActivity?: Date;
  orderHistory?: string[];
  preferences?: string[];
}

interface RecipientSummary {
  total: number;
  bySource: {
    contacts: number;
    orders: number;
    promoOptins: number;
  };
  withConsent: number;
  withOrderHistory: number;
}

interface CampaignData {
  name: string;
  description: string;
  template: "promotional" | "seasonal" | "product" | "custom";

  // AI Generation
  campaignType: "promotional" | "seasonal" | "product" | "custom";
  targetAudience: string;
  keyMessage: string;
  promotionDetails: string;
  callToAction: string;
  tone: "friendly" | "professional" | "exciting" | "urgent";

  // Email Content
  subject: string;
  content: string;
  htmlContent: string;

  // Recipients
  recipientSources: ("contacts" | "orders" | "promoOptins")[];
  filters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    hasOrders?: boolean;
    consentOnly: boolean;
  };

  // Settings
  testMode: boolean;
  sendImmediately: boolean;
  notes: string;
}

const STEPS = [
  {
    id: 1,
    name: "Campaign Details",
    description: "Basic campaign information",
  },
  {
    id: 2,
    name: "Email Content",
    description: "Review and edit email content",
  },
  { id: 3, name: "Recipients", description: "Select target audience" },
  {
    id: 4,
    name: "Review & Save",
    description: "Final review and save changes",
  },
];

export default function EditCampaignPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<RecipientData[]>([]);
  const [recipientSummary, setRecipientSummary] =
    useState<RecipientSummary | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [originalCampaign, setOriginalCampaign] = useState<any>(null);

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    description: "",
    template: "custom",
    campaignType: "promotional",
    targetAudience: "",
    keyMessage: "",
    promotionDetails: "",
    callToAction: "",
    tone: "friendly",
    subject: "",
    content: "",
    htmlContent: "",
    recipientSources: ["contacts", "orders", "promoOptins"],
    filters: {
      consentOnly: true,
    },
    testMode: false,
    sendImmediately: false,
    notes: "",
  });

  useEffect(() => {
    fetchCampaignData();
  }, [params.id]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/marketing/campaigns/${params.id}`);
      const data = await response.json();

      if (data.success) {
        const campaign = data.data.campaign;

        // Check if campaign can be edited
        if (campaign.status !== "draft") {
          setError("Only draft campaigns can be edited");
          return;
        }

        setOriginalCampaign(campaign);

        // Populate form with existing data
        setCampaignData({
          name: campaign.name || "",
          description: campaign.description || "",
          template: campaign.template || "custom",
          campaignType: campaign.template || "promotional",
          targetAudience: campaign.aiGenerationPrompt
            ? extractFromPrompt(campaign.aiGenerationPrompt, "audience")
            : "",
          keyMessage: campaign.aiGenerationPrompt
            ? extractFromPrompt(campaign.aiGenerationPrompt, "message")
            : "",
          promotionDetails: campaign.aiGenerationPrompt
            ? extractFromPrompt(campaign.aiGenerationPrompt, "promotion")
            : "",
          callToAction: campaign.aiGenerationPrompt
            ? extractFromPrompt(campaign.aiGenerationPrompt, "cta")
            : "",
          tone: "friendly",
          subject: campaign.subject || "",
          content: campaign.content || "",
          htmlContent: campaign.htmlContent || "",
          recipientSources: campaign.recipientSources || [
            "contacts",
            "orders",
            "promoOptins",
          ],
          filters: campaign.filters || { consentOnly: true },
          testMode: campaign.testMode || false,
          sendImmediately: false,
          notes: campaign.notes || "",
        });

        // Fetch current recipients
        await fetchRecipients(
          campaign.filters || {},
          campaign.recipientSources || ["contacts", "orders", "promoOptins"],
        );
      } else {
        setError("Failed to fetch campaign data");
      }
    } catch (err) {
      setError("Error fetching campaign data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const extractFromPrompt = (prompt: string, type: string): string => {
    // Simple extraction - in a real app you might store these separately
    return "";
  };

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData((prev) => ({ ...prev, ...updates }));
  };

  const fetchRecipients = async (filters: any = {}, sources: string[] = []) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (sources.length > 0) {
        params.append("sources", sources.join(","));
      }

      if (filters.dateRange) {
        params.append("startDate", filters.dateRange.start.toISOString());
        params.append("endDate", filters.dateRange.end.toISOString());
      }

      if (filters.hasOrders) {
        params.append("hasOrders", "true");
      }

      params.append("consentOnly", (filters.consentOnly !== false).toString());

      const response = await fetch(`/api/v1/marketing/recipients?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecipients(data.data.recipients);
        setRecipientSummary(data.data.summary);
      } else {
        setError("Failed to fetch recipients");
      }
    } catch (err) {
      setError("Error fetching recipients");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    try {
      setGeneratingContent(true);
      setError(null);

      const response = await fetch("/api/v1/marketing/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignType: campaignData.campaignType,
          targetAudience: campaignData.targetAudience,
          keyMessage: campaignData.keyMessage,
          promotionDetails: campaignData.promotionDetails,
          callToAction: campaignData.callToAction,
          tone: campaignData.tone,
          customerData: recipientSummary
            ? {
                totalRecipients: recipientSummary.total,
                hasOrderHistory: recipientSummary.withOrderHistory > 0,
                commonPreferences: [],
              }
            : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateCampaignData({
          subject: data.data.subject,
          content: data.data.content,
          htmlContent: data.data.htmlContent,
        });
        setCurrentStep(2); // Move to content review step
      } else {
        setError(data.details || "Failed to generate content");
      }
    } catch (err) {
      setError("Error generating content");
      console.error("Error:", err);
    } finally {
      setGeneratingContent(false);
    }
  };

  const saveCampaign = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/v1/marketing/campaigns/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignData.name,
          description: campaignData.description,
          subject: campaignData.subject,
          content: campaignData.content,
          htmlContent: campaignData.htmlContent,
          notes: campaignData.notes,
          testMode: campaignData.testMode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/admin/marketing-emails/${params.id}`);
      } else {
        setError(data.details || "Failed to save campaign");
      }
    } catch (err) {
      setError("Error saving campaign");
      console.error("Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);

      // Fetch recipients when moving to recipients step
      if (currentStep + 1 === 3) {
        fetchRecipients(campaignData.filters, campaignData.recipientSources);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim() !== "";
      case 2:
        return (
          campaignData.subject.trim() !== "" &&
          campaignData.content.trim() !== ""
        );
      case 3:
        return recipients.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign Name *
              </label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => updateCampaignData({ name: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="e.g., Summer Bounce House Special"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={campaignData.description}
                onChange={(e) =>
                  updateCampaignData({ description: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="Brief description of this campaign..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign Template
              </label>
              <select
                value={campaignData.template}
                onChange={(e) =>
                  updateCampaignData({
                    template: e.target.value as CampaignData["template"],
                    campaignType: e.target
                      .value as CampaignData["campaignType"],
                  })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
              >
                <option value="promotional">Promotional</option>
                <option value="seasonal">Seasonal</option>
                <option value="product">Product Announcement</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={campaignData.notes}
                onChange={(e) => updateCampaignData({ notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="Any additional notes about this campaign..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <SparklesIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    AI Content Generation
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    You can regenerate the email content using AI or edit it
                    manually below.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={campaignData.targetAudience}
                  onChange={(e) =>
                    updateCampaignData({ targetAudience: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                  placeholder="e.g., Parents planning summer parties"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tone
                </label>
                <select
                  value={campaignData.tone}
                  onChange={(e) =>
                    updateCampaignData({
                      tone: e.target.value as CampaignData["tone"],
                    })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="exciting">Exciting</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key Message
              </label>
              <textarea
                value={campaignData.keyMessage}
                onChange={(e) =>
                  updateCampaignData({ keyMessage: e.target.value })
                }
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="What's the main message you want to convey?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Call to Action
              </label>
              <input
                type="text"
                value={campaignData.callToAction}
                onChange={(e) =>
                  updateCampaignData({ callToAction: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="e.g., Book your bounce house today!"
              />
            </div>

            <button
              onClick={generateContent}
              disabled={generatingContent}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50"
            >
              {generatingContent ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Regenerating Content...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Regenerate Email Content
                </>
              )}
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Subject *
              </label>
              <input
                type="text"
                value={campaignData.subject}
                onChange={(e) =>
                  updateCampaignData({ subject: e.target.value })
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="Email subject line"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Content *
              </label>
              <textarea
                value={campaignData.content}
                onChange={(e) =>
                  updateCampaignData({ content: e.target.value })
                }
                rows={12}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="Email content (plain text)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                HTML Content
              </label>
              <textarea
                value={campaignData.htmlContent}
                onChange={(e) =>
                  updateCampaignData({ htmlContent: e.target.value })
                }
                rows={8}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple font-mono text-sm"
                placeholder="HTML version of the email (optional)"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Recipients Preview
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    This shows the current recipients based on your filters. The
                    actual recipient list will be updated when you save the
                    campaign.
                  </div>
                </div>
              </div>
            </div>

            {recipientSummary && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Current Recipient Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Recipients</div>
                    <div className="font-medium">
                      {recipientSummary.total.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">With Consent</div>
                    <div className="font-medium">
                      {recipientSummary.withConsent.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">From Contacts</div>
                    <div className="font-medium">
                      {recipientSummary.bySource.contacts.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">From Orders</div>
                    <div className="font-medium">
                      {recipientSummary.bySource.orders.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">From Promo Opt-ins</div>
                    <div className="font-medium">
                      {recipientSummary.bySource.promoOptins.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">With Order History</div>
                    <div className="font-medium">
                      {recipientSummary.withOrderHistory.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Ready to Save
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    Review your changes and save the updated campaign.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Campaign Summary
              </h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">{campaignData.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subject</dt>
                  <dd className="text-sm text-gray-900">
                    {campaignData.subject}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Template
                  </dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {campaignData.template}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Test Mode
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {campaignData.testMode ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={campaignData.testMode}
                  onChange={(e) =>
                    updateCampaignData({ testMode: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Test Mode (send only to admin email)
                </span>
              </label>
            </div>

            <button
              onClick={saveCampaign}
              disabled={saving}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Save Campaign
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading campaign...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-purple hover:bg-primary-purple/90"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="mt-2 text-gray-600">
            Modify your marketing email campaign
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <nav aria-label="Progress">
            {/* Mobile: Vertical Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-900">
                  Step {currentStep} of {STEPS.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((currentStep / STEPS.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-primary-purple h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                ></div>
              </div>
              <div className="text-center">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full mb-2 ${
                    currentStep === STEPS[currentStep - 1]?.id
                      ? "bg-primary-purple text-white"
                      : "border-2 border-primary-purple text-primary-purple"
                  }`}
                >
                  <span className="text-sm font-medium">{currentStep}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {STEPS[currentStep - 1]?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {STEPS[currentStep - 1]?.description}
                </p>
              </div>
            </div>

            {/* Desktop: Horizontal Layout */}
            <div className="hidden sm:block">
              <ol className="flex items-center justify-between">
                {STEPS.map((step, stepIdx) => (
                  <li key={step.id} className="relative flex-1">
                    <div className="flex flex-col items-center">
                      {/* Step Circle */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                          step.id < currentStep
                            ? "bg-primary-purple border-primary-purple text-white"
                            : step.id === currentStep
                              ? "border-primary-purple text-primary-purple bg-white"
                              : "border-gray-300 text-gray-500 bg-white"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-semibold">
                            {step.id}
                          </span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="mt-3 text-center max-w-32">
                        <p
                          className={`text-sm font-medium leading-tight ${
                            step.id <= currentStep
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-tight">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Connector Line */}
                    {stepIdx !== STEPS.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-0.5 ${
                          step.id < currentStep
                            ? "bg-primary-purple"
                            : "bg-gray-300"
                        }`}
                        style={{
                          left: "calc(50% + 20px)",
                          width: "calc(100% - 40px)",
                        }}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {STEPS[currentStep - 1].name}
          </h2>
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Previous
        </button>

        {currentStep < STEPS.length && (
          <button
            onClick={nextStep}
            disabled={!canProceed() || loading || generatingContent}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
