/**
 * NVIDIA AI Chat Controller
 * Uses nvidia/llama-3.3-nemotron-super-49b-v1.5 via NVIDIA API
 */

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5';

/**
 * Build the system prompt for the AI
 */
function buildSystemPrompt(bugContext) {
  let prompt = `You are a helpful software developer peer helping a friend debug an issue.

STRICT RULES:
- Do NOT include <think> or </think> tags.
- Do NOT show internal reasoning.
- Only give the final answer.
- Keep responses short, casual, and helpful.
- NO MARKDOWN AT ALL (No **, no ##, no bold, no italics).
- Speak like a real developer chatting on Slack/Discord.

Must respond exactly in this structure:

[A brief friendly opening sentence acknowledging the issue like "Hey! What's going on?"]

Possible causes:
* [cause 1]
* [cause 2]

What you can try:
* [fix 1]
* [fix 2]

[Ask ONE simple question to help troubleshoot, e.g. "Are you seeing any errors in the console?"]`;

  if (bugContext && (bugContext.title || bugContext.description)) {
    prompt += `\n\nYour friend is currently looking at this bug report:
Title: ${bugContext.title || 'N/A'}
Description: ${bugContext.description || 'N/A'}
Tags: ${(bugContext.tags || []).join(', ') || 'N/A'}`;
  }

  return prompt;
}

/**
 * Call NVIDIA API with streaming disabled for simplicity
 */
async function callNvidiaAPI(messages) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not set in environment variables');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('NVIDIA API Error:', response.status, errorText);
    throw new Error(`NVIDIA API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

/**
 * POST /api/ai-chat
 */
async function aiChat(req, res) {
  try {
    const { message, bugContext, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { extractKeywords, searchBugsByKeywords } = require('../utils/aiEngine');
    const Bug = require('../models/Bug');

    // 1. Extract Keywords
    const keywords = extractKeywords(message);

    // 2. SEARCH DATABASE FIRST
    let dbResults = [];
    if (keywords.length > 0) {
      dbResults = await searchBugsByKeywords(Bug, keywords, 3);
    }

    if (dbResults.length > 0) {
      const formattedBugs = dbResults.map(b => ({
        id: b._id,
        title: b.title,
        severity: b.severity,
        isSolved: b.isSolved,
        score: b.score
      }));

      return res.json({
        type: 'matches',
        reply: "🔍 Found similar issues:\n\n👉 Check these discussions first:",
        relatedBugs: formattedBugs,
        keywords
      });
    }

    // 3. IF NO MATCH: Call NVIDIA AI
    const systemPrompt = buildSystemPrompt(bugContext);
    const messages = [{ role: 'system', content: systemPrompt }];

    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-6);
      for (const h of recentHistory) {
        messages.push({
          role: h.role === 'ai' ? 'assistant' : 'user',
          content: h.text || h.content || '',
        });
      }
    }

    messages.push({ role: 'user', content: message });

    let aiResponse = await callNvidiaAPI(messages);

    // Strip out <think>...</think> internal reasoning blocks if they leak
    aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    res.json({
      type: 'nvidia_ai',
      reply: aiResponse,
      keywords
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    res.status(500).json({
      error: 'AI request failed',
      details: error.message,
    });
  }
}

/**
 * Parse the structured AI response into sections
 */
function parseAIResponse(text) {
  const result = { causes: [], fixes: [], followUp: '' };

  try {
    // Extract causes
    const causesMatch = text.match(/\*\*Possible Causes:\*\*([\s\S]*?)(?=\*\*Suggested Fixes|\*\*Follow-up|$)/i);
    if (causesMatch) {
      result.causes = causesMatch[1]
        .split(/[•\-\*]\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
    }

    // Extract fixes
    const fixesMatch = text.match(/\*\*Suggested Fixes:\*\*([\s\S]*?)(?=\*\*Follow-up|$)/i);
    if (fixesMatch) {
      result.fixes = fixesMatch[1]
        .split(/[•\-\*]\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
    }

    // Extract follow-up
    const followUpMatch = text.match(/\*\*Follow-up Question:\*\*([\s\S]*?)$/i);
    if (followUpMatch) {
      result.followUp = followUpMatch[1].trim();
    }
  } catch {
    // If parsing fails, the raw reply is still available
  }

  return result;
}

module.exports = { aiChat };
