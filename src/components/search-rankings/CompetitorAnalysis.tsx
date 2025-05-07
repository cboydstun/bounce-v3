import { useMemo, useState } from "react";
import { SearchRanking, Competitor, ManagedCompetitor } from "@/types/searchRanking";

interface CompetitorAnalysisProps {
  rankings: SearchRanking[];
  managedCompetitors: ManagedCompetitor[];
}

export default function CompetitorAnalysis({
  rankings,
  managedCompetitors,
}: CompetitorAnalysisProps) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(
    managedCompetitors.length > 0 ? managedCompetitors[0]._id : null
  );

  // Get the selected competitor
  const selectedCompetitor = useMemo(() => {
    if (!selectedCompetitorId) return null;
    return managedCompetitors.find(c => c._id === selectedCompetitorId) || null;
  }, [selectedCompetitorId, managedCompetitors]);

  // Get the competitor URL
  const competitorUrl = useMemo(() => {
    return selectedCompetitor?.url || "";
  }, [selectedCompetitor]);
  // Get the most recent ranking
  const latestRanking = useMemo(() => {
    if (rankings.length === 0) return null;

    // Sort rankings by date (newest first)
    const sortedRankings = [...rankings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedRankings[0];
  }, [rankings]);

  // Filter competitors to find the specified competitor
  const specificCompetitor = useMemo(() => {
    if (!latestRanking) return null;

    // Normalize the competitor URL for comparison
    const normalizedCompetitorUrl = competitorUrl
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    // Find the competitor in the list
    return latestRanking.competitors.find((competitor) => {
      const normalizedUrl = competitor.url
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");

      return normalizedUrl.includes(normalizedCompetitorUrl);
    });
  }, [latestRanking, competitorUrl]);

  // Get top competitors (sites ranking above yours)
  const topCompetitors = useMemo(() => {
    if (!latestRanking) return [];

    // Filter competitors that are ranking above your site
    return latestRanking.competitors
      .filter((competitor) => competitor.position < latestRanking.position)
      .sort((a, b) => a.position - b.position);
  }, [latestRanking]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Competitor Analysis
      </h3>

      {!latestRanking ? (
        <div className="text-center text-gray-500 py-8">
          No ranking data available
        </div>
      ) : (
        <div className="space-y-6">
          {/* Competitor Selector */}
          <div className="mb-4">
            <label htmlFor="competitor-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Competitor
            </label>
            <select
              id="competitor-select"
              value={selectedCompetitorId || ""}
              onChange={(e) => setSelectedCompetitorId(e.target.value || null)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              disabled={managedCompetitors.length === 0}
            >
              {managedCompetitors.length === 0 ? (
                <option value="">No competitors available</option>
              ) : (
                managedCompetitors.map((competitor) => (
                  <option key={competitor._id} value={competitor._id}>
                    {competitor.name} ({competitor.url})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Specific Competitor */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              Competitor: {selectedCompetitor?.name || "None selected"}
            </h4>
            {specificCompetitor ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Position
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    #{specificCompetitor.position}
                  </span>
                </div>
                <div className="mb-2">
                  <a
                    href={specificCompetitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-md font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {specificCompetitor.title}
                  </a>
                </div>
                <div className="text-sm text-gray-600">
                  {specificCompetitor.snippet}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                Competitor not found in search results
              </div>
            )}
          </div>

          {/* Top Competitors */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              Sites Ranking Above You
            </h4>
            {topCompetitors.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                No sites ranking above you
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Position
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        URL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {topCompetitors.map((competitor) => (
                      <tr key={competitor.position}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{competitor.position}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {competitor.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <a
                            href={competitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 truncate block max-w-xs"
                          >
                            {competitor.url}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Your Position */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">
                Your Position
              </span>
              <span className="text-sm font-semibold text-gray-900">
                #{latestRanking.position}
              </span>
            </div>
            <div className="mb-2">
              <a
                href={latestRanking.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-md font-medium text-indigo-600 hover:text-indigo-800"
              >
                {latestRanking.url}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
