export const TOOLTIP_CONTENT = {
  // Overall metrics
  overallGrade:
    "Your overall SEO performance grade based on all tracked metrics. Grades range from A (excellent) to F (needs improvement).",
  overallScore:
    "A comprehensive score from 0-100 that combines all SEO metrics including visibility, position quality, consistency, growth, and competitive performance.",

  // Key stats
  totalKeywords:
    "The total number of keywords currently being tracked for your website across all search engines.",
  averagePosition:
    "The average ranking position of all your tracked keywords. Lower numbers are better (position 1 is the top result).",
  visibilityScore:
    "The percentage of your tracked keywords that are ranking in the top 100 search results. Higher percentages indicate better overall visibility.",
  outrankedPercentage:
    "The percentage of keywords where your competitors are ranking higher than you. Lower percentages are better.",

  // Detailed metrics
  visibility:
    "Measures what percentage of your tracked keywords are ranking in the top 100 positions. A higher visibility score means more of your keywords are being found by searchers.",
  position:
    "Evaluates the quality of your ranking positions. This considers how many keywords rank in top positions (1-3, 4-10, etc.). Lower average positions indicate better performance.",
  consistency:
    "Measures how stable your keyword rankings are over time. High consistency means your rankings don't fluctuate much, indicating strong, reliable SEO performance.",
  growth:
    "Tracks the overall trend of your keyword rankings. Positive growth means your rankings are improving over time, while negative growth indicates declining performance.",
  competitive:
    "Compares your performance against tracked competitors. A higher competitive score means you're outranking competitors more often across your keyword set.",

  // Keyword breakdown
  top3Positions:
    "Keywords ranking in positions 1-3. These are your best performing keywords that appear at the very top of search results.",
  top10Positions:
    "Keywords ranking in positions 4-10. These appear on the first page of search results and receive good visibility.",
  top20Positions:
    "Keywords ranking in positions 11-20. These appear on the second page of search results and receive moderate visibility.",
  notRanking:
    "Keywords that are not found in the top 100 search results. These need attention to improve their rankings.",

  // Trends
  positionTrend:
    "Shows whether your average keyword positions are improving (↗), declining (↘), or staying stable (→) over the selected time period.",
  visibilityTrend:
    "Indicates if more of your keywords are ranking (improving), fewer are ranking (declining), or visibility is stable over time.",
  competitiveTrend:
    "Shows whether you're gaining ground against competitors (improving), losing ground (declining), or maintaining your competitive position (stable).",

  // Sections
  topPerformers:
    "Your best-performing keywords that are ranking well and showing positive trends. These are your SEO success stories.",
  needsAttention:
    "Keywords that are underperforming or showing declining trends. These require optimization efforts to improve their rankings.",
  competitiveOpportunities:
    "Keywords where competitors are significantly outranking you, representing opportunities to improve and gain market share.",

  // Competitive analysis
  competitorGap:
    "The difference in ranking positions between you and a competitor for a specific keyword. Smaller gaps are easier to close with optimization efforts.",

  // Period selector
  periodSelector:
    "Choose the time period for analysis. Longer periods show broader trends, while shorter periods highlight recent changes in performance.",
} as const;
