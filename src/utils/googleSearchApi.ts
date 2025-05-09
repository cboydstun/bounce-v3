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
}

/**
 * Checks the ranking of a target domain for a specific keyword using Google Custom Search API
 * @param keyword The keyword to search for
 * @param targetDomain The domain to check ranking for (e.g., "satxbounce.com")
 * @returns Object containing position, URL, and competitor information
 */
export async function checkKeywordRanking(
  keyword: string,
  targetDomain: string,
): Promise<RankingResult> {
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

    // Make request to Google Custom Search API
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1`,
      {
        params: {
          key: apiKey,
          cx: cx,
          q: keyword,
          num: 10, // Maximum results per page
        },
      },
    );

    const items = response.data.items || [];
    const results: SearchResult[] = items.map((item: any, index: number) => ({
      position: index + 1,
      url: item.link,
      title: item.title,
      snippet: item.snippet || "",
    }));

    // Find our website's position
    let ourPosition = -1;
    let ourUrl = "";

    const competitors: Array<{
      position: number;
      title: string;
      url: string;
      snippet: string;
    }> = [];

    results.forEach((result) => {
      // Normalize the result URL for comparison
      const normalizedResultUrl = result.url
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");

      // Check if the result URL is from our domain
      // The URL should either be exactly our domain or a subdomain/path of our domain
      if (
        normalizedResultUrl === normalizedTargetDomain ||
        normalizedResultUrl.startsWith(normalizedTargetDomain + "/") ||
        normalizedResultUrl.startsWith(normalizedTargetDomain + ".")
      ) {
        ourPosition = result.position;
        ourUrl = result.url;
      } else {
        competitors.push({
          position: result.position,
          title: result.title,
          url: result.url,
          snippet: result.snippet,
        });
      }
    });

    // If our website is not found in the results, use a default URL
    if (ourPosition === -1 || !ourUrl) {
      // Ensure the target domain has a protocol
      ourUrl = targetDomain.startsWith("http")
        ? targetDomain
        : `https://${targetDomain}`;
    }

    return {
      position: ourPosition,
      url: ourUrl,
      competitors,
    };
  } catch (error) {
    console.error("Error checking keyword ranking:", error);
    throw error;
  }
}
