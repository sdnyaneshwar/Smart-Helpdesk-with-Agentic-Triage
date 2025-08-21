import { Queue, Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import Ticket from '../models/ticket.js';
import Article from '../models/article.js';
import AgentSuggestion from '../models/agentSuggestion.js';
import AuditLog from '../models/auditLog.js';
import Config from '../models/config.js';
import { OpenAI } from 'openai';
import { URL } from 'url';
import dotenv from 'dotenv';
dotenv.config();
// Parse REDIS_URI
const redisUrl = new URL(process.env.REDIS_URI || 'redis://localhost:6379');
console.log('Parsed REDIS_URI:', {
  host: redisUrl.hostname,
  port: redisUrl.port,
  username: redisUrl.username,
  password: redisUrl.password,
});

const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
  // Enable TLS for Redis Cloud
  tls: process.env.REDIS_URI.includes('rediss://') ? {} : undefined,
};

// Initialize Queue
const queue = new Queue('triageQueue', {
  connection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
});

// Prompts (versioned)
const PROMPT_VERSION = '1.0';
const classifyPrompt = `Classify the ticket into one of: billing, tech, shipping, other. Output JSON: {"predictedCategory": "category", "confidence": 0.0-1.0}`;
const draftPrompt = `Draft a reply based on ticket and KB articles. Include citations. Output JSON: {"draftReply": "text", "citations": ["id1"]}`;

// Stub LLM Provider
class LLMStub {
  async classify(text) {
    const keywords = {
      billing: ['refund', 'invoice', 'payment', 'charge'],
      tech: ['error', 'bug', 'stack', 'login'],
      shipping: ['delivery', 'shipment', 'package', 'track'],
    };
    let category = 'other';
    let matchCount = 0;
    const lowerText = text.toLowerCase();
    for (const [cat, words] of Object.entries(keywords)) {
      const matches = words.filter(word => lowerText.includes(word)).length;
      if (matches > matchCount) {
        matchCount = matches;
        category = cat;
      }
    }
    const confidence = Math.min(matchCount / 3, 1);
    return { predictedCategory: category, confidence };
  }

  async draft(text, articles) {
    const draftReply = `Based on your issue: ${text}\n` + articles.map((art, i) => `[${i+1}] ${art.title}: ${art.body.slice(0, 100)}...`).join('\n');
    const citations = articles.map(art => art._id.toString());
    return { draftReply, citations };
  }
}

// Real LLM (optional)
let openai;
if (process.env.STUB_MODE !== 'true' && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function callLLM(prompt, text, articles = []) {
  if (process.env.STUB_MODE === 'true' || !openai) {
    const stub = new LLMStub();
    return articles.length ? stub.draft(text, articles) : stub.classify(text);
  } else {
    const start = Date.now();
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: text + (articles ? '\nArticles: ' + JSON.stringify(articles) : '') }],
        temperature: 0.2,
        max_tokens: 500,
        timeout: 10000,
      });
      const latency = Date.now() - start;
      return { ...JSON.parse(response.choices[0].message.content), latencyMs: latency };
    } catch (err) {
      console.error({ error: err.message, ticketId: text });
      throw new Error('LLM call failed');
    }
  }
}

// Retrieve KB (keyword search, top 3)
async function retrieveKB(description, category) {
  const query = { $text: { $search: description + ' ' + category }, status: 'published' };
  return await Article.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(3);
}

// Ensure config exists
async function getConfig() {
  let config = await Config.findOne();
  if (!config) {
    config = new Config({
      autoCloseEnabled: process.env.AUTO_CLOSE_ENABLED === 'true',
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.78,
      slaHours: 24,
    });
    await config.save();
  }
  return config;
}

// Agent Workflow
async function triageTicket(ticketId, traceId) {
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      await logStep(ticketId, traceId, 'ERROR', { message: 'Ticket not found' });
      return;
    }

    const start = Date.now();
    let modelInfo = { provider: process.env.STUB_MODE === 'true' ? 'stub' : 'openai', model: 'gpt-3.5-turbo', promptVersion: PROMPT_VERSION, latencyMs: 0 };

    // Step 1: Classify
    const { predictedCategory, confidence } = await callLLM(classifyPrompt, ticket.description + ' ' + ticket.title);
    await logStep(ticketId, traceId, 'AGENT_CLASSIFIED', { category: predictedCategory, confidence });

    // Step 2: Retrieve KB
    const articles = await retrieveKB(ticket.description, predictedCategory);
    const articleIds = articles.map(art => art._id);
    await logStep(ticketId, traceId, 'KB_RETRIEVED', { articleIds: articleIds.map(id => id.toString()) });

    // Step 3: Draft
    const { draftReply, citations } = await callLLM(draftPrompt, ticket.description, articles);
    modelInfo.latencyMs = Date.now() - start;
    await logStep(ticketId, traceId, 'DRAFT_GENERATED', { draftReply });

    // Save suggestion
    const suggestion = new AgentSuggestion({
      ticketId,
      predictedCategory,
      articleIds: citations,
      draftReply,
      confidence,
      modelInfo,
    });
    await suggestion.save();
    ticket.agentSuggestionId = suggestion._id;
    ticket.category = predictedCategory;
    ticket.status = 'triaged';
    await ticket.save();

    // Step 4: Decision
    const config = await getConfig();
    if (config.autoCloseEnabled && confidence >= config.confidenceThreshold) {
      ticket.description += `\n\nAuto Reply: ${draftReply}`;
      ticket.status = 'resolved';
      suggestion.autoClosed = true;
      await suggestion.save();
      await ticket.save();
      await logStep(ticketId, traceId, 'AUTO_CLOSED', { confidence });
    } else {
      ticket.status = 'waiting_human';
      await ticket.save();
      await logStep(ticketId, traceId, 'ASSIGNED_TO_HUMAN', {});
    }
  } catch (err) {
    console.error({ error: err.message, ticketId, traceId });
    await logStep(ticketId, traceId, 'ERROR', { message: err.message });
  }
}

async function logStep(ticketId, traceId, action, meta) {
  await new AuditLog({
    ticketId,
    traceId,
    actor: 'system',
    action,
    meta,
    timestamp: new Date().toISOString(),
  }).save();
}

// Worker to process queue
const worker = new Worker('triageQueue', async (job) => {
  const { ticketId, traceId } = job.data;
  await triageTicket(ticketId, traceId);
}, { connection, maxConcurrency: 1 });

// Enqueue function
export default {
  enqueueTriage: async (ticketId, traceId) => {
    await queue.add('triage', { ticketId, traceId });
  },
};