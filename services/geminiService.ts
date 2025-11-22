import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage, MessageRole, UploadedFile, RetrievalMetric } from "../types";

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are Nexus, a specialized Multi-Modal RAG (Retrieval-Augmented Generation) assistant. 
Your goal is to answer questions accurately based ONLY on the provided documents (images, text, tables).

Rules:
1.  **Grounding**: Always base your answers on the visual and textual content provided in the session.
2.  **Citations**: When answering, refer to specific parts of the document (e.g., "As seen in Table 1", "According to the chart on page 2").
3.  **Multimodal**: You can see images. Interpret charts, graphs, and screenshots of documents accurately.
4.  **Honesty**: If the information is not in the documents, state that clearly. Do not hallucinate outside knowledge unless explicitly asked for general definitions.
5.  **Format**: Use Markdown for formatting. Use bold for key terms.
`;

export const generateRAGResponse = async (
  history: ChatMessage[],
  currentPrompt: string,
  files: UploadedFile[]
): Promise<{ text: string; metrics: RetrievalMetric }> => {
  
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const startTime = performance.now();

  try {
    // Prepare parts
    const inputParts: any[] = [];

    // 1. Add Context (Files)
    // In a production RAG, we would retrieve chunks. 
    // Here, we use Gemini's massive context window to "ingest" the whole document set for high-accuracy "Context Caching" simulation.
    files.forEach(file => {
      // Remove data URL prefix for the API
      const base64Data = file.data.split(',')[1];
      
      inputParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: base64Data
        }
      });
    });

    // 2. Add Chat History (Simulated as text context or previous turns)
    // For simplicity in this "stateless" call pattern to allow dynamic file injection per turn:
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

    // Call Gemini 2.5 Flash (Efficient for RAG)
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Best for multimodal document ingestion
      contents: {
        role: 'user',
        parts: inputParts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Low temperature for factual RAG
        maxOutputTokens: 2048,
      }
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);

    // Estimate tokens (rough heuristic for demo, real API returns usageMetadata)
    const usage = response.usageMetadata;
    const totalTokens = usage?.totalTokenCount || 0;

    return {
      text: response.text || "I couldn't generate a response based on the documents.",
      metrics: {
        latencyMs: latency,
        tokensUsed: totalTokens,
        sourcesCount: files.length,
        modelName: 'gemini-2.5-flash'
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
