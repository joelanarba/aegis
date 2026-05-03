import { getConfig } from "./config";

/**
 * Tavily Search API client.
 * Provides web search with AI-optimized results.
 * Free tier: 1,000 searches/month.
 */

const TAVILY_API_URL = "https://api.tavily.com/search";

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  query: string;
  results: TavilySearchResult[];
  answer: string | null;
}

/**
 * Search the web using Tavily's search API.
 * Returns ranked results with content snippets.
 */
export async function searchWeb(
  query: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeAnswer?: boolean;
  }
): Promise<TavilyResponse> {
  const config = getConfig();
  if (!config.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY not configured");
  }

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: config.TAVILY_API_KEY,
      query,
      max_results: options?.maxResults ?? 5,
      search_depth: options?.searchDepth ?? "basic",
      include_answer: options?.includeAnswer ?? true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    query: data.query || query,
    answer: data.answer || null,
    results: (data.results || []).map((r: Record<string, unknown>) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
      score: r.score || 0,
    })),
  };
}
