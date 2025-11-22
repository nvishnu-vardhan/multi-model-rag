import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MessageRole, UploadedFile, RetrievalMetric, ModelProvider } from "../types";

const GOOGLE_API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a specialized Multi-Modal RAG (Retrieval-Augmented Generation) assistant. 
Your goal is to answer questions accurately based ONLY on the provided documents (images, text, tables).

Rules:
1.  **Grounding**: Always base your answers on the visual and textual content provided in the session.
2.  **Citations**: When answering, refer to specific parts of the document (e.g., "As seen in Table 1", "According to the chart on page 2").
3.  **Multimodal**: You can see images. Interpret charts, graphs, and screenshots of documents accurately.
4.  **Honesty**: If the information is not in the documents, state that clearly. Do not hallucinate outside knowledge.
5.  **Format**: Use Markdown for formatting. Use bold for key terms.
`;

export const generateMultiModalResponse = async (
  history: ChatMessage[],
  currentPrompt: string,
  files: UploadedFile[],
  provider: ModelProvider,
  openAIKey?: string
): Promise<{ text: string; metrics: RetrievalMetric }> => {
  
  const startTime = performance.now();

  try {
    if (provider === ModelProvider.GOOGLE) {
      if (!GOOGLE_API_KEY) throw new Error("Google API Key is missing.");
      return await callGemini(history, currentPrompt, files, startTime);
    } else if (provider === ModelProvider.OPENAI) {
      if (!openAIKey) throw new Error("OpenAI API Key is required.");
      return await callOpenAI(history, currentPrompt, files, openAIKey, startTime);
    } else {
      throw new Error("Invalid Model Provider selected.");
    }
  } catch (error) {
    console.error(`${provider} API Error:`, error);
    throw error;
  }
};

// --- Google Gemini Implementation ---
async function callGemini(
  history: ChatMessage[],
  currentPrompt: string,
  files: UploadedFile[],
  startTime: number
) {
  const inputParts: any[] = [];

  // 1. Add Context (Files)
  files.forEach(file => {
    const base64Data = file.data.split(',')[1];
    inputParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: base64Data
      }
    });
  });

  // 2. Add Chat History
  const historyContext = history
    .filter(m => m.role !== MessageRole.SYSTEM)
    .map(m => `${m.role === MessageRole.USER ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  if (historyContext) {
    inputParts.push({
      text: `Previously in conversation:\n${historyContext}\n\n`
    });
  }

  // 3. Add Current Prompt
  inputParts.push({
    text: `User Query: ${currentPrompt}`
  });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      role: 'user',
      parts: inputParts
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  });

  const endTime = performance.now();
  const latency = Math.round(endTime - startTime);
  const totalTokens = response.usageMetadata?.totalTokenCount || 0;

  return {
    text: response.text || "No response generated.",
    metrics: {
      latencyMs: latency,
      tokensUsed: totalTokens,
      sourcesCount: files.length,
      modelName: 'Gemini 2.5 Flash'
    }
  };
}

// --- OpenAI Implementation ---
async function callOpenAI(
  history: ChatMessage[],
  currentPrompt: string,
  files: UploadedFile[],
  apiKey: string,
  startTime: number
) {
  // Construct messages for OpenAI
  const messages: any[] = [
    { role: "system", content: SYSTEM_INSTRUCTION }
  ];

  // Add history
  history.filter(m => m.role !== MessageRole.SYSTEM).forEach(m => {
    messages.push({
      role: m.role === MessageRole.USER ? 'user' : 'assistant',
      content: m.content
    });
  });

  // Current message with images
  const currentContent: any[] = [
    { type: "text", text: currentPrompt }
  ];

  files.forEach(file => {
    // OpenAI expects data URL for image_url
    if (file.mimeType.startsWith('image/')) {
      currentContent.push({
        type: "image_url",
        image_url: {
          url: file.data
        }
      });
    } else {
      // For text/pdf files, we append as text (simplified for this demo)
      // In a real app, we'd parse the PDF text. Here we just warn or assume text.
      // If it's a text file, we can decode base64.
      if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown') {
         const text = atob(file.data.split(',')[1]);
         currentContent.push({ type: "text", text: `\n[Document Context: ${file.name}]\n${text}\n` });
      } else {
         currentContent.push({ type: "text", text: `\n[Attached File: ${file.name} (${file.mimeType}) - Content not fully parsed in OpenAI mode]\n` });
      }
    }
  });

  messages.push({
    role: "user",
    content: currentContent
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o", // Best for multimodal
      messages: messages,
      max_tokens: 2048,
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "OpenAI API Request Failed");
  }

  const data = await res.json();
  const endTime = performance.now();
  
  return {
    text: data.choices[0]?.message?.content || "No response.",
    metrics: {
      latencyMs: Math.round(endTime - startTime),
      tokensUsed: data.usage?.total_tokens || 0,
      sourcesCount: files.length,
      modelName: 'GPT-4o'
    }
  };
}