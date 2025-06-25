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
            <button
              onClick={() =>
                router.push(`/admin/marketing-emails/${params.id}/edit`)
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Recipients ({analytics.recipients.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recipients.map((recipient, index) => (
                      <tr key={index}>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </div>
  );
}
