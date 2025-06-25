"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeftIcon,
  PencilIcon,
  PaperAirplaneIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
  PlusIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Recipient {
  email: string;
  name: string;
  status:
    | "pending"
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "failed"
    | "unsubscribed";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  subject: string;
  content: string;
  htmlContent: string;
  template: string;
  recipientSources: string[];
  filters: any;
  status:
    | "draft"
    | "scheduled"
    | "sending"
    | "completed"
    | "failed"
    | "cancelled";
  testMode: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  aiGenerationPrompt?: string;
  notes?: string;
}

interface Analytics {
  campaign: {
    id: string;
    name: string;
    subject: string;
    status: string;
    sentAt?: string;
    completedAt?: string;
  };
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    unsubscribed: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  recipients: Recipient[];
}

interface CampaignResponse {
  success: boolean;
  data: {
    campaign: Campaign;
    analytics: Analytics;
  };
}

export default function CampaignDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "content" | "recipients" | "analytics"
  >("overview");
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendTestMode, setSendTestMode] = useState(false);

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
  const [recipientToEdit, setRecipientToEdit] = useState<Recipient | null>(
    null,
  );

  useEffect(() => {
    fetchCampaignDetails();
  }, [params.id]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/marketing/campaigns/${params.id}`);
      const data: CampaignResponse = await response.json();

      if (data.success) {
        setCampaign(data.data.campaign);
        setAnalytics(data.data.analytics);
      } else {
        setError("Failed to fetch campaign details");
      }
    } catch (err) {
      setError("Error fetching campaign details");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return <PencilIcon className="h-5 w-5 text-gray-500" />;
      case "scheduled":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "sending":
        return <PaperAirplaneIcon className="h-5 w-5 text-yellow-500" />;
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "cancelled":
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRecipientStatusColor = (status: Recipient["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "opened":
        return "bg-purple-100 text-purple-800";
      case "clicked":
        return "bg-indigo-100 text-indigo-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "unsubscribed":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sendCampaign = async (testMode: boolean = false) => {
    try {
      setSending(true);
      setError(null);

      const response = await fetch(
        `/api/v1/marketing/campaigns/${params.id}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ testMode }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh campaign details to show updated status
        await fetchCampaignDetails();
        setShowSendDialog(false);

        // Show success message
        alert(data.message || "Campaign sent successfully!");
      } else {
        setError(data.details || "Failed to send campaign");
      }
    } catch (err) {
      setError("Error sending campaign");
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSendClick = () => {
    setShowSendDialog(true);
    setSendTestMode(campaign?.testMode || false);
  };

  // Recipient management functions
  const filteredRecipients =
    analytics?.recipients.filter((recipient) => {
      const matchesSearch =
        !recipientSearch ||
        recipient.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        recipient.name.toLowerCase().includes(recipientSearch.toLowerCase());

      const matchesFilter =
        recipientFilter === "all" || recipient.status === recipientFilter;

      return matchesSearch && matchesFilter;
    }) || [];

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

  const handleRemoveRecipient = async (email: string) => {
    if (!campaign || campaign.status !== "draft") return;

    try {
      const response = await fetch(
        `/api/v1/marketing/campaigns/${params.id}/recipients`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: [email] }),
        },
      );

      if (response.ok) {
        await fetchCampaignDetails();
        setSelectedRecipients((prev) => {
          const newSet = new Set(prev);
          newSet.delete(email);
          return newSet;
        });
      } else {
        setError("Failed to remove recipient");
      }
    } catch (err) {
      setError("Error removing recipient");
    }
  };

  const handleResendToRecipient = async (email: string) => {
    try {
      const response = await fetch(
        `/api/v1/marketing/campaigns/${params.id}/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: [email] }),
        },
      );

      if (response.ok) {
        await fetchCampaignDetails();
      } else {
        setError("Failed to resend to recipient");
      }
    } catch (err) {
      setError("Error resending to recipient");
    }
  };

  const generateRecipientCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Status",
      "Sent At",
      "Delivered At",
      "Opened At",
      "Clicked At",
      "Failure Reason",
    ];
    const rows = filteredRecipients.map((recipient) => [
      recipient.name,
      recipient.email,
      recipient.status,
      recipient.sentAt || "",
      recipient.deliveredAt || "",
      recipient.openedAt || "",
      recipient.clickedAt || "",
      recipient.failureReason || "",
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

  const handleAddRecipient = async () => {
    if (!newRecipientEmail || !newRecipientName || campaign?.status !== "draft")
      return;

    try {
      const response = await fetch(
        `/api/v1/marketing/campaigns/${params.id}/recipients`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: [
              {
                email: newRecipientEmail,
                name: newRecipientName,
              },
            ],
          }),
        },
      );

      if (response.ok) {
        await fetchCampaignDetails();
        setShowAddRecipient(false);
        setNewRecipientEmail("");
        setNewRecipientName("");
      } else {
        setError("Failed to add recipient");
      }
    } catch (err) {
      setError("Error adding recipient");
    }
  };

  const handleBulkRemove = async () => {
    if (selectedRecipients.size === 0 || campaign?.status !== "draft") return;

    try {
      const response = await fetch(
        `/api/v1/marketing/campaigns/${params.id}/recipients`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: Array.from(selectedRecipients) }),
        },
      );

      if (response.ok) {
        await fetchCampaignDetails();
        setSelectedRecipients(new Set());
        setShowRemoveDialog(false);
      } else {
        setError("Failed to remove recipients");
      }
    } catch (err) {
      setError("Error removing recipients");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading campaign details...</div>
      </div>
    );
  }

  if (error || !campaign || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || "Campaign not found"}
          </p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {campaign.name}
              </h1>
              <div className="flex items-center">
                {getStatusIcon(campaign.status)}
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                >
                  {campaign.status}
                </span>
                {campaign.testMode && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Test Mode
                  </span>
                )}
              </div>
            </div>
            <p className="mt-2 text-gray-600">{campaign.subject}</p>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-500">
                {campaign.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          {campaign.status === "draft" && (
            <>
              <button
                onClick={() =>
                  router.push(`/admin/marketing-emails/${params.id}/edit`)
                }
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleSendClick}
                disabled={sending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </button>
            </>
          )}
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-purple hover:bg-primary-purple/90">
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Recipients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.stats.total.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Delivered
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.stats.delivered.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">
                      ({analytics.rates.deliveryRate.toFixed(1)}%)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Opened
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.stats.opened.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">
                      ({analytics.rates.openRate.toFixed(1)}%)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CursorArrowRaysIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Clicked
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analytics.stats.clicked.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">
                      ({analytics.rates.clickRate.toFixed(1)}%)
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: "overview", name: "Overview", icon: ChartBarIcon },
              { id: "content", name: "Email Content", icon: EnvelopeIcon },
              { id: "recipients", name: "Recipients", icon: UserGroupIcon },
              { id: "analytics", name: "Analytics", icon: ChartBarIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? "border-primary-purple text-primary-purple"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6 py-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Campaign Details
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Template
                      </dt>
                      <dd className="text-sm text-gray-900 capitalize">
                        {campaign.template}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created By
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {campaign.createdBy.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Created At
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {formatDate(campaign.createdAt)}
                      </dd>
                    </div>
                    {campaign.sentAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Sent At
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {formatDate(campaign.sentAt)}
                        </dd>
                      </div>
                    )}
                    {campaign.completedAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Completed At
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {formatDate(campaign.completedAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Recipient Sources
                  </h3>
                  <div className="space-y-2">
                    {campaign.recipientSources.map((source) => (
                      <span
                        key={source}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize mr-2"
                      >
                        {source}
                      </span>
                    ))}
                  </div>

                  {campaign.notes && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Notes
                      </h4>
                      <p className="text-sm text-gray-900">{campaign.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Email Subject
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-sm text-gray-900">{campaign.subject}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Email Content
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                    {campaign.content}
                  </pre>
                </div>
              </div>

              {campaign.aiGenerationPrompt && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    AI Generation Prompt
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-900">
                      {campaign.aiGenerationPrompt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "recipients" && (
            <div className="space-y-6">
              {/* Recipients Header with Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Recipients Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    {analytics.recipients.length} total recipients
                  </p>
                </div>

                {campaign.status === "draft" && (
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
                )}
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
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="opened">Opened</option>
                      <option value="clicked">Clicked</option>
                      <option value="failed">Failed</option>
                      <option value="unsubscribed">Unsubscribed</option>
                    </select>
                    <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => {
                      const csvContent = generateRecipientCSV();
                      downloadCSV(
                        csvContent,
                        `${campaign.name}-recipients.csv`,
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
                        {campaign.status === "draft" && (
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
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                        {campaign.status === "draft" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecipients.map((recipient, index) => (
                        <tr
                          key={`${recipient.email}-${index}`}
                          className="hover:bg-gray-50"
                        >
                          {campaign.status === "draft" && (
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
                          )}
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
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecipientStatusColor(recipient.status)}`}
                            >
                              {recipient.status}
                            </span>
                            {recipient.failureReason && (
                              <div className="text-xs text-red-600 mt-1">
                                {recipient.failureReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {recipient.sentAt
                              ? formatDate(recipient.sentAt)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {recipient.clickedAt
                              ? `Clicked: ${formatDate(recipient.clickedAt)}`
                              : recipient.openedAt
                                ? `Opened: ${formatDate(recipient.openedAt)}`
                                : recipient.deliveredAt
                                  ? `Delivered: ${formatDate(recipient.deliveredAt)}`
                                  : "-"}
                          </td>
                          {campaign.status === "draft" && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setRecipientToEdit(recipient)}
                                  className="text-primary-purple hover:text-primary-purple/80"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveRecipient(recipient.email)
                                  }
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                                {recipient.status === "failed" && (
                                  <button
                                    onClick={() =>
                                      handleResendToRecipient(recipient.email)
                                    }
                                    className="text-green-600 hover:text-green-800"
                                    title="Retry sending"
                                  >
                                    <ArrowPathIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
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
                        : "Get started by adding your first recipient."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Delivery Rate
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.rates.deliveryRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${analytics.rates.deliveryRate}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Open Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.rates.openRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${analytics.rates.openRate}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Click Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.rates.clickRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${analytics.rates.clickRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Status Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Sent</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.stats.sent}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Delivered</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.stats.delivered}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Opened</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.stats.opened}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Clicked</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.stats.clicked}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Failed</span>
                      <span className="text-sm font-medium text-red-600">
                        {analytics.stats.failed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">
                        Unsubscribed
                      </span>
                      <span className="text-sm font-medium text-orange-600">
                        {analytics.stats.unsubscribed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Campaign Dialog */}
      {showSendDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Send Campaign
                </h3>
                <button
                  onClick={() => setShowSendDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to send this campaign?
                </p>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendMode"
                      checked={!sendTestMode}
                      onChange={() => setSendTestMode(false)}
                      className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      🚨 PRODUCTION MODE: Send to all recipients (
                      {analytics?.stats.total || 0} emails)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendMode"
                      checked={sendTestMode}
                      onChange={() => setSendTestMode(true)}
                      className="h-4 w-4 text-primary-purple focus:ring-primary-purple border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      🧪 TEST MODE: Send only to admin email (1 email)
                    </span>
                  </label>
                </div>

                {!sendTestMode && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ PRODUCTION MODE WARNING: This will send{" "}
                      {analytics?.stats.total || 0} emails to real customers!
                    </p>
                  </div>
                )}

                {sendTestMode && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      ✅ TEST MODE: Only 1 email will be sent to the admin email
                      address (OTHER_EMAIL) for testing purposes.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSendDialog(false)}
                  disabled={sending}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-purple disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => sendCampaign(sendTestMode)}
                  disabled={sending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2 inline-block" />
                      {sendTestMode ? "Send Test Email" : "Send Campaign"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    This action cannot be undone. The recipients will be
                    permanently removed from this campaign.
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
                    Status
                  </label>
                  <select
                    value={recipientToEdit.status}
                    onChange={(e) =>
                      setRecipientToEdit({
                        ...recipientToEdit,
                        status: e.target.value as Recipient["status"],
                      })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-purple focus:border-primary-purple"
                  >
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="opened">Opened</option>
                    <option value="clicked">Clicked</option>
                    <option value="failed">Failed</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
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
                  onClick={async () => {
                    // Handle edit recipient logic here
                    try {
                      const response = await fetch(
                        `/api/v1/marketing/campaigns/${params.id}/recipients`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ recipient: recipientToEdit }),
                        },
                      );

                      if (response.ok) {
                        await fetchCampaignDetails();
                        setRecipientToEdit(null);
                      } else {
                        setError("Failed to update recipient");
                      }
                    } catch (err) {
                      setError("Error updating recipient");
                    }
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
