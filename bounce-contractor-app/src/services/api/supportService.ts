import { apiClient } from "./apiClient";
import { ApiResponse } from "../../types/api.types";

export interface SupportRequestData {
  type: "general" | "bug" | "feature";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  subject: string;
  message: string;
  systemInfo?: {
    appVersion?: string;
    platform?: string;
    userAgent?: string;
  };
}

export interface BugReportData {
  title: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  systemInfo?: {
    appVersion?: string;
    platform?: string;
    userAgent?: string;
  };
}

export interface FeatureRequestData {
  title: string;
  description: string;
  useCase?: string;
  priority: "low" | "medium" | "high";
  category: string;
}

export interface SupportResponse {
  referenceId: string;
  estimatedResponseTime?: string;
  priority?: string;
}

class SupportService {
  /**
   * Get system information for support requests
   */
  private getSystemInfo() {
    return {
      appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
      platform: this.getPlatform(),
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Detect platform
   */
  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/android/.test(userAgent)) {
      return "Android";
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      return "iOS";
    } else if (/windows/.test(userAgent)) {
      return "Windows";
    } else if (/macintosh|mac os x/.test(userAgent)) {
      return "macOS";
    } else if (/linux/.test(userAgent)) {
      return "Linux";
    } else {
      return "Unknown";
    }
  }

  /**
   * Submit a general support request
   */
  async submitSupportRequest(
    data: Omit<SupportRequestData, "systemInfo">,
  ): Promise<SupportResponse> {
    const requestData: SupportRequestData = {
      ...data,
      systemInfo: this.getSystemInfo(),
    };

    const response: ApiResponse<SupportResponse> = await apiClient.post(
      "/support/contact",
      requestData,
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to submit support request");
    }

    return response.data!;
  }

  /**
   * Submit a bug report
   */
  async submitBugReport(
    data: Omit<BugReportData, "systemInfo">,
  ): Promise<SupportResponse> {
    const bugData: BugReportData = {
      ...data,
      systemInfo: this.getSystemInfo(),
    };

    const response: ApiResponse<SupportResponse> = await apiClient.post(
      "/support/bug-report",
      bugData,
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to submit bug report");
    }

    return response.data!;
  }

  /**
   * Submit a feature request
   */
  async submitFeatureRequest(
    data: FeatureRequestData,
  ): Promise<SupportResponse> {
    const response: ApiResponse<SupportResponse> = await apiClient.post(
      "/support/feature-request",
      data,
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to submit feature request");
    }

    return response.data!;
  }

  /**
   * Get support categories
   */
  getSupportCategories(): string[] {
    return [
      "Account & Profile",
      "Tasks & Jobs",
      "Payments & Earnings",
      "Technical Issues",
      "Mobile App",
      "Notifications",
      "Other",
    ];
  }

  /**
   * Get bug categories
   */
  getBugCategories(): string[] {
    return [
      "Login/Authentication",
      "Task Management",
      "Payment Issues",
      "App Crashes",
      "UI/Display Issues",
      "Performance",
      "Notifications",
      "Data Sync",
      "Other",
    ];
  }

  /**
   * Get feature categories
   */
  getFeatureCategories(): string[] {
    return [
      "Task Management",
      "User Interface",
      "Notifications",
      "Reporting",
      "Mobile Features",
      "Integration",
      "Performance",
      "Other",
    ];
  }

  /**
   * Open email client with support email
   */
  openEmailSupport(subject?: string): void {
    const supportEmail = "satxbounce@gmail.com"; // Update with actual support email
    const emailSubject = subject || "Support Request";
    const body = `
Hi Support Team,

I need assistance with:

[Please describe your issue here]

Best regards,
[Your name]

---
App Version: ${this.getSystemInfo().appVersion}
Platform: ${this.getSystemInfo().platform}
    `.trim();

    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  /**
   * Open phone dialer with support number
   */
  callSupport(): void {
    const supportPhone = "+15551234567"; // Update with actual support phone
    window.location.href = `tel:${supportPhone}`;
  }

  /**
   * Get FAQ data
   */
  getFAQData() {
    return [
      {
        category: "Account",
        questions: [
          {
            question: "How do I update my profile information?",
            answer:
              "Go to Profile > Edit Profile to update your personal information, skills, and contact details.",
          },
          {
            question: "How do I change my password?",
            answer:
              "Currently, password changes must be requested through support. Contact us and we'll help you reset your password.",
          },
          {
            question: "How do I verify my account?",
            answer:
              "Check your email for a verification link after registration. If you didn't receive it, contact support for assistance.",
          },
        ],
      },
      {
        category: "Tasks",
        questions: [
          {
            question: "How do I claim a task?",
            answer:
              'Browse available tasks, tap on one you\'re interested in, and click "Claim Task" if you meet the requirements.',
          },
          {
            question: "Can I cancel a claimed task?",
            answer:
              "Yes, but please do so as early as possible. Go to My Tasks, find the task, and contact support to cancel.",
          },
          {
            question: "How do I mark a task as complete?",
            answer:
              'Once you\'ve finished the work, go to the task details and tap "Mark Complete". You may need to add photos or notes.',
          },
        ],
      },
      {
        category: "Payments",
        questions: [
          {
            question: "When do I get paid?",
            answer:
              "Payments are processed weekly for completed tasks. You'll receive payment within 3-5 business days after completion.",
          },
          {
            question: "How can I track my earnings?",
            answer:
              "Check your Profile page for an earnings summary, or view detailed payment history in the earnings section.",
          },
          {
            question: "What if I haven't received payment?",
            answer:
              "Contact support with your task details and we'll investigate the payment status for you.",
          },
        ],
      },
      {
        category: "Technical",
        questions: [
          {
            question: "The app is running slowly. What can I do?",
            answer:
              "Try closing and reopening the app, ensure you have a stable internet connection, and make sure you're running the latest version.",
          },
          {
            question: "I'm not receiving notifications. How do I fix this?",
            answer:
              "Check your notification settings in the app and ensure notifications are enabled in your device settings.",
          },
          {
            question: "The app keeps crashing. What should I do?",
            answer:
              "Try restarting the app and your device. If the problem persists, please report the bug through the support system.",
          },
        ],
      },
    ];
  }
}

export const supportService = new SupportService();
export default supportService;
