import { searchWeb, type TavilyResponse } from "@/lib/tavily";
import { textCompletion, SMART_MODEL } from "@/lib/openai";

/**
 * Web Research Agent
 * Multi-step research: query → search → synthesize → cite sources.
 */

export interface ResearchResult {
  query: string;
  synthesis: string;
  sources: { title: string; url: string }[];
  tavilyAnswer: string | null;
}

const SYNTHESIS_PROMPT = `You are a research assistant. You've been given web search results for a user's query. 
Synthesize the information into a clear, comprehensive, and well-organized answer.

Rules:
- Be concise but thorough
- Use bullet points for lists of facts
- If the search results are conflicting, mention both perspectives
- Reference which sources support which claims using [1], [2], etc.
- End with a brief conclusion or key takeaway
- If the search results don't adequately answer the query, say so honestly`;

/**
 * Research a topic by searching the web and synthesizing the results.
 */
export async function conductResearch(
  userId: string,
  query: string
): Promise<ResearchResult> {
  // Step 1: Search the web
  let searchResults: TavilyResponse;
  try {
    searchResults = await searchWeb(query, {
      maxResults: 5,
      searchDepth: "basic",
      includeAnswer: true,
    });
  } catch (error) {
    // If Tavily is not configured, return a helpful message
    return {
      query,
      synthesis: "Web search is not available. Please configure TAVILY_API_KEY to enable research capabilities.",
      sources: [],
      tavilyAnswer: null,
    };
  }

  // Step 2: Build context from search results
  let context = `Query: "${query}"\n\nSearch Results:\n\n`;
  const sources: { title: string; url: string }[] = [];

  searchResults.results.forEach((result, index) => {
    context += `[${index + 1}] ${result.title}\nURL: ${result.url}\n${result.content}\n\n`;
    sources.push({ title: result.title, url: result.url });
  });

  if (searchResults.answer) {
    context += `\nQuick Answer: ${searchResults.answer}\n`;
  }

  // Step 3: Synthesize with AI
  const synthesis = await textCompletion({
    userId,
    actionType: "research",
    systemPrompt: SYNTHESIS_PROMPT,
    userPrompt: context,
    model: SMART_MODEL,
    temperature: 0.4,
    maxTokens: 1500,
  });

  return {
    query,
    synthesis,
    sources,
    tavilyAnswer: searchResults.answer,
  };
}
