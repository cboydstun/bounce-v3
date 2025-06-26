"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  UserGroupIcon,
  XCircleIcon,
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
    name: "AI Content Generation",
    description: "Generate email content with AI",
  },
  {
    id: 3,
    name: "Email Content",
    description: "Review and edit email content",
  },
  { id: 4, name: "Recipients", description: "Select target audience" },
  {
    id: 5,
    name: "Review & Send",
    description: "Final review and send options",
  },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<RecipientData[]>([]);
  const [recipientSummary, setRecipientSummary] =
    useState<RecipientSummary | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);

  // Recipient management state
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [recipientSearch, setRecipientSearch] = useState<string>("");
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [recipientToEdit, setRecipientToEdit] = useState<RecipientData | null>(
    null,
  );

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

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData((prev) => ({ ...prev, ...updates }));
  };

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (campaignData.recipientSources.length > 0) {
        params.append("sources", campaignData.recipientSources.join(","));
      }

      if (campaignData.filters.dateRange) {
        params.append(
          "startDate",
          campaignData.filters.dateRange.start.toISOString(),
        );
        params.append(
          "endDate",
          campaignData.filters.dateRange.end.toISOString(),
        );
      }

      if (campaignData.filters.hasOrders) {
        params.append("hasOrders", "true");
      }

      params.append("consentOnly", campaignData.filters.consentOnly.toString());

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
                commonPreferences: [], // Could be enhanced with actual preference analysis
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
        setCurrentStep(3); // Move to content review step
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

  const createCampaign = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/v1/marketing/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...campaignData,
          filters: {
            ...campaignData.filters,
            sources: campaignData.recipientSources,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/admin/marketing-emails/${data.data.id}`);
      } else {
        setError(data.details || "Failed to create campaign");
      }
    } catch (err) {
      setError("Error creating campaign");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);

      // Fetch recipients when moving to recipients step
      if (currentStep + 1 === 4) {
        fetchRecipients();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Recipient management functions
  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      !recipientSearch ||
      recipient.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      recipient.name.toLowerCase().includes(recipientSearch.toLowerCase());

    const matchesFilter =
      recipientFilter === "all" ||
      (recipientFilter === "consent" && recipient.consentStatus) ||
      (recipientFilter === "no-consent" && !recipient.consentStatus) ||
      recipient.source === recipientFilter;

    return matchesSearch && matchesFilter;
  });

  const handleSelectAll = () => {
    if (
      selectedRecipients.size === filteredRecipients.length &&
      filteredRecipients.length > 0
    ) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(filteredRecipients.map((r) => r.email)));
    }
  };

  const handleRecipientSelect = (email: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedRecipients(newSelected);
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      newSet.delete(email);
      return newSet;
    });
  };

  const handleAddRecipient = () => {
    if (!newRecipientEmail || !newRecipientName) return;

    // Check for duplicates
    const exists = recipients.some(
      (r) => r.email.toLowerCase() === newRecipientEmail.toLowerCase(),
    );
    if (exists) {
      setError("Recipient with this email already exists");
      return;
    }

    const newRecipient: RecipientData = {
      email: newRecipientEmail.toLowerCase().trim(),
      name: newRecipientName.trim(),
      source: "contacts",
      sourceId: "manual",
      consentStatus: true,
      lastActivity: new Date(),
    };

    setRecipients((prev) => [...prev, newRecipient]);
    setShowAddRecipient(false);
    setNewRecipientEmail("");
    setNewRecipientName("");
    setError(null);
  };

  const handleBulkRemove = () => {
    setRecipients((prev) =>
      prev.filter((r) => !selectedRecipients.has(r.email)),
    );
    setSelectedRecipients(new Set());
    setShowRemoveDialog(false);
  };

  const generateRecipientCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Source",
      "Consent Status",
      "Last Activity",
    ];
    const rows = filteredRecipients.map((recipient) => [
      recipient.name,
      recipient.email,
      recipient.source,
      recipient.consentStatus ? "Yes" : "No",
      recipient.lastActivity
        ? new Date(recipient.lastActivity).toLocaleDateString()
        : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim() !== "";
      case 2:
        return (
          campaignData.targetAudience.trim() !== "" &&
          campaignData.keyMessage.trim() !== "" &&
          campaignData.callToAction.trim() !== ""
        );
      case 3:
        return (
          campaignData.subject.trim() !== "" &&
          campaignData.content.trim() !== ""
        );
      case 4:
        return recipients.length > 0;
      case 5:
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
                    Provide details about your campaign and our AI will generate
                    personalized email content for you.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Audience *
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
                Key Message *
              </label>
              <textarea
                value={campaignData.keyMessage}
                onChange={(e) =>
                  updateCampaignData({ keyMessage: e.target.value })
                }
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="What's the main message you want to convey?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Promotion Details
              </label>
              <textarea
                value={campaignData.promotionDetails}
                onChange={(e) =>
                  updateCampaignData({ promotionDetails: e.target.value })
                }
                rows={2}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                placeholder="Specific promotion details, discounts, or offers..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Call to Action *
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

            <div className="pt-4">
              <button
                onClick={generateContent}
                disabled={generatingContent || !canProceed()}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingContent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Content...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate Email Content
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
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

      case 4:
        return (
          <div className="space-y-6">
            {/* Recipient Sources Configuration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Recipient Sources
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    value: "contacts",
                    label: "Contacts",
                    description: "People who have contacted us",
                  },
                  {
                    value: "orders",
                    label: "Orders",
                    description: "Customers who have placed orders",
                  },
                  {
                    value: "promoOptins",
                    label: "Promo Opt-ins",
                    description: "Users who opted in for promotions",
                  },
                ].map((source) => (
                  <label
                    key={source.value}
                    className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={campaignData.recipientSources.includes(
                        source.value as any,
                      )}
                      onChange={(e) => {
                        const sources = e.target.checked
                          ? [
                              ...campaignData.recipientSources,
                              source.value as any,
                            ]
                          : campaignData.recipientSources.filter(
                              (s) => s !== source.value,
                            );
                        updateCampaignData({ recipientSources: sources });
                      }}
                      className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-700">
                        {source.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {source.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Consent Filter */}
            <div className="border border-gray-200 rounded-md p-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={campaignData.filters.consentOnly}
                  onChange={(e) =>
                    updateCampaignData({
                      filters: {
                        ...campaignData.filters,
                        consentOnly: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Only include recipients who have given consent
                </span>
              </label>
            </div>

            {/* Fetch Recipients Button */}
            <button
              onClick={fetchRecipients}
              disabled={loading || campaignData.recipientSources.length === 0}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Loading Recipients...
                </>
              ) : (
                "Load Recipients"
              )}
            </button>

            {/* Recipients Management Interface */}
            {recipients.length > 0 && (
              <>
                {/* Recipients Header with Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Recipients Management
                    </h3>
                    <p className="text-sm text-gray-500">
                      {recipients.length} total recipients loaded
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowAddRecipient(true)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Recipient
                    </button>

                    {selectedRecipients.size > 0 && (
                      <button
                        onClick={() => setShowRemoveDialog(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Remove ({selectedRecipients.size})
                      </button>
                    )}
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search recipients by email or name..."
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-purple focus:border-primary-purple"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="relative">
                      <select
                        value={recipientFilter}
                        onChange={(e) => setRecipientFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-purple focus:border-primary-purple rounded-md"
                      >
                        <option value="all">All Recipients</option>
                        <option value="consent">With Consent</option>
                        <option value="no-consent">No Consent</option>
                        <option value="contacts">From Contacts</option>
                        <option value="orders">From Orders</option>
                        <option value="promoOptins">From Promo Opt-ins</option>
                      </select>
                      <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={() => {
                        const csvContent = generateRecipientCSV();
                        downloadCSV(
                          csvContent,
                          `${campaignData.name || "campaign"}-recipients.csv`,
                        );
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                {/* Recipients Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={
                                selectedRecipients.size ===
                                  filteredRecipients.length &&
                                filteredRecipients.length > 0
                              }
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recipient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Consent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Activity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRecipients.map((recipient, index) => (
                          <tr
                            key={`${recipient.email}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.has(
                                  recipient.email,
                                )}
                                onChange={() =>
                                  handleRecipientSelect(recipient.email)
                                }
                                className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {recipient.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {recipient.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {recipient.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  recipient.consentStatus
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {recipient.consentStatus ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {recipient.lastActivity
                                ? new Date(
                                    recipient.lastActivity,
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setRecipientToEdit(recipient)}
                                  className="text-primary-purple hover:text-primary-purple/80"
                                  title="Edit recipient"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveRecipient(recipient.email)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                  title="Remove recipient"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredRecipients.length === 0 && (
                    <div className="text-center py-12">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No recipients found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {recipientSearch || recipientFilter !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "Load recipients using the button above."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary Statistics */}
                {recipientSummary && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Recipient Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total Recipients</div>
                        <div className="font-medium">
                          {recipients.length.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">With Consent</div>
                        <div className="font-medium">
                          {recipients
                            .filter((r) => r.consentStatus)
                            .length.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">From Contacts</div>
                        <div className="font-medium">
                          {recipients
                            .filter((r) => r.source === "contacts")
                            .length.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">From Orders</div>
                        <div className="font-medium">
                          {recipients
                            .filter((r) => r.source === "orders")
                            .length.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">From Promo Opt-ins</div>
                        <div className="font-medium">
                          {recipients
                            .filter((r) => r.source === "promoOptins")
                            .length.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Selected</div>
                        <div className="font-medium">
                          {selectedRecipients.size.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Campaign Ready
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    Your campaign is ready to send to{" "}
                    {recipients.length.toLocaleString()} recipients.
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
                    Recipients
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {recipients.length.toLocaleString()}
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

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={campaignData.sendImmediately}
                  onChange={(e) =>
                    updateCampaignData({ sendImmediately: e.target.checked })
                  }
                  className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Send immediately after creation
                </span>
              </label>
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

            <button
              onClick={createCampaign}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Campaign...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Create Campaign
                </>
              )}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">
            Create Marketing Campaign
          </h1>
          <p className="mt-2 text-gray-600">
            Create an AI-powered email marketing campaign
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

      {/* Add Recipient Dialog */}
      {showAddRecipient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Add Recipient
                </h3>
                <button
                  onClick={() => setShowAddRecipient(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                    placeholder="Enter recipient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newRecipientEmail}
                    onChange={(e) => setNewRecipientEmail(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddRecipient(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipient}
                  disabled={!newRecipientEmail || !newRecipientName}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-2 inline-block" />
                  Add Recipient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Remove Dialog */}
      {showRemoveDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Remove Recipients
                </h3>
                <button
                  onClick={() => setShowRemoveDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Are you sure you want to remove {selectedRecipients.size}{" "}
                  selected recipient{selectedRecipients.size !== 1 ? "s" : ""}?
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    This action cannot be undone. The recipients will be removed
                    from this campaign.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRemove}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2 inline-block" />
                  Remove Recipients
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Recipient Dialog */}
      {recipientToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Recipient
                </h3>
                <button
                  onClick={() => setRecipientToEdit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={recipientToEdit.name}
                    onChange={(e) =>
                      setRecipientToEdit({
                        ...recipientToEdit,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={recipientToEdit.email}
                    onChange={(e) =>
                      setRecipientToEdit({
                        ...recipientToEdit,
                        email: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    value={recipientToEdit.source}
                    onChange={(e) =>
                      setRecipientToEdit({
                        ...recipientToEdit,
                        source: e.target.value as RecipientData["source"],
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                  >
                    <option value="contacts">Contacts</option>
                    <option value="orders">Orders</option>
                    <option value="promoOptins">Promo Opt-ins</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={recipientToEdit.consentStatus}
                      onChange={(e) =>
                        setRecipientToEdit({
                          ...recipientToEdit,
                          consentStatus: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Has given consent
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setRecipientToEdit(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Update the recipient in the list
                    setRecipients((prev) =>
                      prev.map((r) =>
                        r.email === recipientToEdit.email ? recipientToEdit : r,
                      ),
                    );
                    setRecipientToEdit(null);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple"
                >
                  <PencilIcon className="h-4 w-4 mr-2 inline-block" />
                  Update Recipient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
