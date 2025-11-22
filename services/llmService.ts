import * as webllm from "@mlc-ai/web-llm";
import { ChatMessage, MessageRole, UploadedFile, RetrievalMetric, ModelProvider } from "../types";

// WebLLM Engine - runs entirely in browser with no API keys needed
let engine: webllm.MLCEngine | null = null;
let isInitializing = false;

const SYSTEM_INSTRUCTION = `
You are a specialized Multi-Modal RAG (Retrieval-Augmented Generation) assistant. 
Your goal is to answer questions accurately based ONLY on the provided documents (images, text, tables).

Rules:
1. **Grounding**: Always base your answers on the visual and textual content provided in the session.
2. **Citations**: When answering, refer to specific parts of the document (e.g., "As seen in Table 1", "According to the chart on page 2").
3. **Multimodal**: You can see images. Interpret charts, graphs, and screenshots of documents accurately.
4. **Honesty**: If the information is not in the documents, state that clearly. Do not hallucinate outside knowledge.
5. **Format**: Use Markdown for formatting. Use bold for key terms.
`;

// Initialize WebLLM engine (downloads model to browser cache)
export async function initializeEngine(onProgress?: (progress: string) => void): Promise<void> {
  if (engine) return; // Already initialized
  if (isInitializing) {
    // Wait for initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isInitializing = true;
  try {
    engine = await webllm.CreateMLCEngine(
      "Llama-3.2-3B-Instruct-q4f32_1-MLC", // Lightweight model for browser
      {
        initProgressCallback: (progress) => {
          if (onProgress) {
            onProgress(progress.text);
          }
        },
      }
    );
  } finally {
    isInitializing = false;
  }
}

export const generateMultiModalResponse = async (
  history: ChatMessage[],
  currentPrompt: string,
  files: UploadedFile[],
  provider: ModelProvider,
  openAIKey?: string,
  onProgress?: (progress: string) => void
): Promise<{ text: string; metrics: RetrievalMetric }> => {
  
  const startTime = performance.now();
  
  try {
    // Initialize engine if not ready
    if (!engine) {
      await initializeEngine(onProgress);
    }

    if (!engine) {
      throw new Error("Failed to initialize WebLLM engine");
    }

    // Build context from files
    let contextText = "";
    
    for (const file of files) {
      if (file.mimeType.startsWith('image/')) {
        contextText += `\n[Image Document: ${file.name}]\n`;
        contextText += `Image content analysis: This is a visual document that may contain charts, tables, diagrams, or text. `;        contextText += `Please analyze this image carefully when answering questions.\n`;
      } else if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown') {
        // Decode base64 text
        try {
          const text = atob(file.data.split(',')[1]);
          contextText += `\n[Document: ${file.name}]\n${text}\n`;
        } catch (e) {
          contextText += `\n[Document: ${file.name}] - Could not parse content\n`;
        }
      } else if (file.mimeType === 'application/pdf') {
        contextText += `\n[PDF Document: ${file.name}]\n`;
        contextText += `This is a PDF document that may contain text, images, tables, and charts. `;
        contextText += `When answering questions, refer to this document's content.\n`;
      } else {
        contextText += `\n[Attached File: ${file.name} (${file.mimeType})]\n`;
      }
    }

    // Build messages array
    const messages: webllm.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_INSTRUCTION }
    ];

    // Add file context as system message
    if (contextText) {
      messages.push({
        role: "user",
        content: `Document Context:\n${contextText}`
      });
    }

    // Add chat history
    history
      .filter(m => m.role !== MessageRole.SYSTEM)
      .forEach(m => {
        messages.push({
          role: m.role === MessageRole.USER ? 'user' : 'assistant',
          content: m.content
        });
      });

    // Add current prompt
    messages.push({
      role: "user",
      content: currentPrompt
    });

    // Generate response using WebLLM
    const response = await engine.chat.completions.create({
      messages: messages,
      temperature: 0.3,
      max_tokens: 2048,
    });

    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    const responseText = response.choices[0]?.message?.content || "No response generated.";
    const totalTokens = (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0);

    return {
      text: responseText,
      metrics: {
        latencyMs: latency,
        tokensUsed: totalTokens,
        sourcesCount: files.length,
        modelName: 'Llama-3.2-3B (WebLLM - Browser)'
      }
    };
  } catch (error) {
    console.error("WebLLM Error:", error);
    throw new Error(`WebLLM inference failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Cleanup function
export function resetEngine() {
  engine = null;
  isInitializing = false;
}
