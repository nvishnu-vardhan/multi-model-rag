
# Multi Model RAG (Nexus)

A high-performance, Multi-Modal Retrieval-Augmented Generation (RAG) system designed for complex document intelligence. This application ingests text, tables, and images (OCR/Vision) to provide citation-backed answers using Google Gemini 2.5 and OpenAI GPT-4o.

## Features

*   **Multi-Modal Ingestion**: Drag-and-drop support for PDFs, text files, and images.
*   **Dual Model Support**: Switch seamlessly between Google Gemini 2.5 Flash and OpenAI GPT-4o.
*   **Visual Intelligence**: Interprets charts, graphs, and visual data within documents.
*   **PWA Support**: Installable as a native-like app on Android and iOS.
*   **RAG Metrics**: Displays latency, token usage, and source attribution for every query.

## Tech Stack

*   **Frontend**: React 19, Tailwind CSS, Lucide Icons
*   **AI/LLM**: Google GenAI SDK, OpenAI API (REST)
*   **Architecture**: Client-side RAG with context injection

## Getting Started

1.  Clone the repository.
2.  Open `index.html` in a modern browser (or serve via a local server like Live Server).
3.  The app comes pre-configured with necessary API keys for demonstration purposes.

## Deployment (Vercel / Netlify)

To deploy this app with your OpenAI Key securely:

1.  Push the code to GitHub.
2.  Import the repository in **Vercel**.
3.  In the **"Environment Variables"** section (during import or in Settings), add:
    *   **Key**: `VITE_OPENAI_API_KEY`
    *   **Value**: `sk-proj-....` (Your actual OpenAI Key)
4.  Deploy. The app will automatically use this key.

## License

MIT
