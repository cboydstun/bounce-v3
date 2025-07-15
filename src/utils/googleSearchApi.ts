import axios from "axios";

interface SearchResult {
  position: number;
  url: string;
  title: string;
  snippet: string;
}

interface RankingResult {
  position: number;
  url: string;
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    snippet: string;
  }>;
  metadata: {
    totalResults: string;
    searchTime: string;
    resultCount: number;
    isValidationPassed: boolean;
    validationWarnings: string[];
    apiCallsUsed?: number;
    searchDepth?: number;
    maxPositionSearched?: number;
  };
}

interface GoogleSearchApiResponse {
  items?: Array<{
    title: string;
    link: string;
    snippet?: string;
  }>;
  searchInformation?: {
    totalResults: string;
    searchTime: string;
  };
}

/**
 * Validates search results to detect potential CSE configuration issues
 * @param position The found position of the target domain
 * @param competitors Array of competitor results
 * @param targetDomain The target domain being searched for
 * @param keyword The search keyword
 * @returns Validation result with warnings
 */
function validateSearchResults(
  position: number,
  competitors: Array<{
    position: number;
    title: string;
    url: string;
    snippet: string;
  }>,
  targetDomain: string,
  keyword: string,
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;

  // Check if target domain is consistently ranking too high (potential CSE restriction)
  if (position > 0 && position <= 2) {
    warnings.push(
      `Target domain ranks in position ${position} - this may indicate CSE is restricted to specific sites`,
    );
    isValid = false;
  }

  // Check for lack of diverse competitors (another sign of CSE restriction)
  const uniqueDomains = new Set(
    competitors.map((comp) => {
      try {
        return new URL(comp.url).hostname.replace(/^www\./, "");
      } catch {
        return comp.url;
      }
    }),
  );

  if (uniqueDomains.size < 5 && competitors.length >= 5) {
    warnings.push(
      `Low domain diversity in results (${uniqueDomains.size} unique domains) - may indicate CSE restriction`,
    );
    isValid = false;
  }

  // Check if all results contain the target domain (major red flag)
  const allResultsFromTarget = competitors.every((comp) => {
    const normalizedUrl = comp.url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");
    const normalizedTarget = targetDomain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");
    return normalizedUrl.includes(normalizedTarget);
  });

  if (allResultsFromTarget && competitors.length > 0) {
    warnings.push(
      "All search results appear to be from the target domain - CSE is likely restricted to this site only",
    );
    isValid = false;
  }

  return { isValid, warnings };
}

/**
 * Searches multiple pages to find the actual ranking of a target domain
 * @param keyword The keyword to search for
 * @param targetDomain The domain to check ranking for
 * @param maxPosition Maximum position to search (default: 50)
 * @returns Object containing position, URL, competitor information, and search metadata
 */
export async function checkKeywordRanking(
  keyword: string,
  targetDomain: string,
  maxPosition: number = 50,
): Promise<RankingResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;

    if (!apiKey || !cx) {
      throw new Error("Google API credentials are not configured");
    }

    // Normalize the target domain for comparison
    const normalizedTargetDomain = targetDomain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "");

    let allResults: SearchResult[] = [];
    let ourPosition = -1;
    let ourUrl = "";
    let totalApiCalls = 0;
    let searchInfo = { totalResults: "0", searchTime: "0" };

    // Search multiple pages until we find the target domain or reach max position
    const resultsPerPage = 10;
    const maxPages = Math.ceil(maxPosition / resultsPerPage);

    for (let page = 0; page < maxPages; page++) {
      const startIndex = page * resultsPerPage + 1;

      try {
        const response = await axios.get(
          `https://www.googleapis.com/customsearch/v1`,
          {
            params: {
              key: apiKey,
              cx: cx,
              q: keyword,
              num: resultsPerPage,
              start: startIndex,
            },
          },
        );

        totalApiCalls++;
        const apiData: GoogleSearchApiResponse = response.data;
        const items = apiData.items || [];

        // Store search info from first page
        if (page === 0) {
          searchInfo = apiData.searchInformation || {
            totalResults: "0",
            searchTime: "0",
          };
        }

        // Process results for this page
        const pageResults: SearchResult[] = items.map(
          (item: any, index: number) => ({
            position: startIndex + index,
            url: item.link,
            title: item.title,
            snippet: item.snippet || "",
          }),
        );

        allResults = [...allResults, ...pageResults];

        // Check if we found our domain on this page
        for (const result of pageResults) {
          const normalizedResultUrl = result.url
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "");

          if (
            normalizedResultUrl === normalizedTargetDomain ||
            normalizedResultUrl.startsWith(normalizedTargetDomain + "/") ||
            normalizedResultUrl.startsWith(normalizedTargetDomain + ".")
          ) {
            ourPosition = result.position;
            ourUrl = result.url;

            break;
          }
        }

        // If we found our domain, we can stop searching
        if (ourPosition > 0) {
          break;
        }

        // If this page returned fewer results than expected, we've reached the end
        if (items.length < resultsPerPage) {
          break;
        }

        // Add proper rate limiting between API calls (1.5 seconds)
        if (page < maxPages - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Error searching page ${page + 1}:`, error);

        // Handle rate limiting (429 errors) with exponential backoff
        if ((error as any).response?.status === 429) {
          const retryDelay = Math.min(5000 * Math.pow(2, page), 30000); // 5s, 10s, 20s, 30s max
          await new Promise((resolve) => setTimeout(resolve, retryDelay));

          // Retry the same page once
          try {
            const retryResponse = await axios.get(
              `https://www.googleapis.com/customsearch/v1`,
              {
                params: {
                  key: apiKey,
                  cx: cx,
                  q: keyword,
                  num: resultsPerPage,
                  start: startIndex,
                },
              },
            );

            totalApiCalls++;
            const apiData: GoogleSearchApiResponse = retryResponse.data;
            const items = apiData.items || [];

            // Store search info from first page
            if (page === 0) {
              searchInfo = apiData.searchInformation || {
                totalResults: "0",
                searchTime: "0",
              };
            }

            // Process results for this page
            const pageResults: SearchResult[] = items.map(
              (item: any, index: number) => ({
                position: startIndex + index,
                url: item.link,
                title: item.title,
                snippet: item.snippet || "",
              }),
            );

            allResults = [...allResults, ...pageResults];

            // Check if we found our domain on this page
            for (const result of pageResults) {
              const normalizedResultUrl = result.url
                .toLowerCase()
                .replace(/^https?:\/\//, "")
                .replace(/^www\./, "");

              if (
                normalizedResultUrl === normalizedTargetDomain ||
                normalizedResultUrl.startsWith(normalizedTargetDomain + "/") ||
                normalizedResultUrl.startsWith(normalizedTargetDomain + ".")
              ) {
                ourPosition = result.position;
                ourUrl = result.url;
                break;
              }
            }

            // If we found our domain, we can stop searching
            if (ourPosition > 0) {
              break;
            }

            // If this page returned fewer results than expected, we've reached the end
            if (items.length < resultsPerPage) {
              break;
            }
          } catch (retryError) {
            // If retry also fails, continue to next page
            continue;
          }
        } else {
          // For non-rate-limit errors, continue with next page
          continue;
        }
      }
    }

    // If our website is not found in the results, use a default URL
    if (ourPosition === -1 || !ourUrl) {
      ourUrl = targetDomain.startsWith("http")
        ? targetDomain
        : `https://${targetDomain}`;
    }

    // Get competitors from all results (excluding our domain)
    const competitors = allResults
      .filter((result) => {
        const normalizedResultUrl = result.url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return !(
          normalizedResultUrl === normalizedTargetDomain ||
          normalizedResultUrl.startsWith(normalizedTargetDomain + "/") ||
          normalizedResultUrl.startsWith(normalizedTargetDomain + ".")
        );
      })
      .map((result) => ({
        position: result.position,
        title: result.title,
        url: result.url,
        snippet: result.snippet,
      }));

    // Validate the search results (using first 10 for validation)
    const firstPageCompetitors = competitors.filter((c) => c.position <= 10);
    const validation = validateSearchResults(
      ourPosition > 0 && ourPosition <= 10 ? ourPosition : -1,
      firstPageCompetitors,
      targetDomain,
      keyword,
    );

    const result: RankingResult = {
      position: ourPosition,
      url: ourUrl,
      competitors: competitors.slice(0, 50), // Limit competitors to first 50 for storage efficiency
      metadata: {
        totalResults: searchInfo.totalResults,
        searchTime: searchInfo.searchTime,
        resultCount: allResults.length,
        isValidationPassed: validation.isValid,
        validationWarnings: validation.warnings,
        apiCallsUsed: totalApiCalls,
        searchDepth: allResults.length,
        maxPositionSearched: maxPosition,
      },
    };

    return result;
  } catch (error) {
    console.error(
      `❌ Error in enhanced keyword ranking check for "${keyword}":`,
      error,
    );
    throw error;
  }
}

/**
 * Quick search that only checks the first page (top 10 results)
 * @param keyword The keyword to search for
 * @param targetDomain The domain to check ranking for
 * @returns Object containing position, URL, competitor information, and validation metadata
 */
export async function checkKeywordRankingQuick(
  keyword: string,
  targetDomain: string,
): Promise<RankingResult> {
  return checkKeywordRanking(keyword, targetDomain, 10);
}

/**
 * Deep search that checks up to 100 positions
 * @param keyword The keyword to search for
 * @param targetDomain The domain to check ranking for
 * @returns Object containing position, URL, competitor information, and validation metadata
 */
export async function checkKeywordRankingDeep(
  keyword: string,
  targetDomain: string,
): Promise<RankingResult> {
  return checkKeywordRanking(keyword, targetDomain, 100);
}

/**
 * Creates a diagnostic test to verify CSE configuration
 * @param testKeywords Array of keywords to test
 * @param targetDomain The target domain
 * @returns Diagnostic results
 */
export async function diagnoseCseConfiguration(
  testKeywords: string[],
  targetDomain: string,
): Promise<{
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
  testResults: Array<{
    keyword: string;
    position: number;
    warnings: string[];
  }>;
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const testResults: Array<{
    keyword: string;
    position: number;
    warnings: string[];
  }> = [];

  for (const keyword of testKeywords) {
    try {
      const result = await checkKeywordRanking(keyword, targetDomain);
      testResults.push({
        keyword,
        position: result.position,
        warnings: result.metadata.validationWarnings,
      });

      // Analyze patterns across keywords
      if (result.position > 0 && result.position <= 2) {
        issues.push(
          `Keyword "${keyword}" ranks suspiciously high at position ${result.position}`,
        );
      }
    } catch (error) {
      console.error(`Failed to test keyword "${keyword}":`, error);
      issues.push(`Failed to test keyword "${keyword}": ${error}`);
    }
  }

  // Analyze overall patterns
  const highRankingCount = testResults.filter(
    (r) => r.position > 0 && r.position <= 2,
  ).length;
  const totalTestedKeywords = testResults.length;

  if (highRankingCount / totalTestedKeywords > 0.5) {
    issues.push(
      `${highRankingCount}/${totalTestedKeywords} keywords rank in top 2 positions - likely CSE restriction`,
    );
    recommendations.push("Check Google Programmable Search Engine settings");
    recommendations.push('Ensure "Search the entire web" is enabled');
    recommendations.push("Remove any site restrictions in CSE configuration");
  }

  const isHealthy = issues.length === 0;

  if (!isHealthy) {
    issues.forEach((issue) => console.log(`   - ${issue}`));
  }

  return {
    isHealthy,
    issues,
    recommendations,
    testResults,
  };
}
