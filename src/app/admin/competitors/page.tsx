"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CompetitorManager from "@/components/search-rankings/CompetitorManager";
import { ManagedCompetitor } from "@/types/searchRanking";

export default function CompetitorsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<ManagedCompetitor[]>([]);

  // Fetch competitors on component mount
  useEffect(() => {
    const fetchCompetitors = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/v1/competitors");
        setCompetitors(response.data.competitors);
      } catch (error: any) {
        console.error("Error fetching competitors:", error);
        setError("Failed to fetch competitors. Please try again later.");
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitors();
  }, [router]);

  // Handle competitor addition
  const handleAddCompetitor = async (name: string, url: string, notes?: string) => {
    try {
      const response = await api.post("/api/v1/competitors", {
        name,
        url,
        notes,
      });
      
      // Add the new competitor to the list
      setCompetitors([...competitors, response.data.competitor]);
      
      return { success: true };
    } catch (error: any) {
      console.error("Error adding competitor:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to add competitor" 
      };
    }
  };

  // Handle competitor update
  const handleUpdateCompetitor = async (id: string, data: { name?: string; url?: string; notes?: string; isActive?: boolean }) => {
    try {
      const response = await api.patch(`/api/v1/competitors/${id}`, data);
      
      // Update the competitor in the list
      const updatedCompetitors = competitors.map((c) =>
        c._id === id ? response.data.competitor : c
      );
      
      setCompetitors(updatedCompetitors);
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating competitor:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to update competitor" 
      };
    }
  };

  // Handle competitor deletion
  const handleDeleteCompetitor = async (id: string) => {
    try {
      await api.delete(`/api/v1/competitors/${id}`);
      
      // Remove the competitor from the list
      const updatedCompetitors = competitors.filter((c) => c._id !== id);
      setCompetitors(updatedCompetitors);
      
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting competitor:", error);
      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to delete competitor" 
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Competitors
          </h2>
          <div className="mt-1">
            <a 
              href="/admin/search-rankings" 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              ← Back to Search Rankings
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor Manager */}
        <div className="lg:col-span-2">
          <CompetitorManager
            competitors={competitors}
            onAddCompetitor={handleAddCompetitor}
            onUpdateCompetitor={handleUpdateCompetitor}
            onDeleteCompetitor={handleDeleteCompetitor}
          />
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">About Competitors</h3>
            <div className="text-sm text-gray-500 space-y-4">
              <p>
                Competitors are businesses that compete with you in search results. 
                Tracking your competitors helps you understand your market position.
              </p>
              <p>
                Add your main competitors here to track them in the search rankings dashboard.
                Active competitors will be highlighted in the competitor analysis section.
              </p>
              <p>
                Tips:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add your main competitors first</li>
                <li>Use the full URL including https://</li>
                <li>Add notes to remember why you're tracking them</li>
                <li>Disable competitors you don't want to track anymore</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
