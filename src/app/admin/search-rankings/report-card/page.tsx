"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReportCard from "@/components/search-rankings/ReportCard";

export default function SearchRankingsReportCardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("last30Days");

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            SEO Performance Report Card
          </h1>
          <div className="mt-1 flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/search-rankings")}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Search Rankings
            </button>
            <span className="text-gray-300">|</span>
            <a
              href="/admin/competitors"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Manage Competitors →
            </a>
          </div>
        </div>
      </div>

      <ReportCard period={period} onPeriodChange={handlePeriodChange} />
    </div>
  );
}
