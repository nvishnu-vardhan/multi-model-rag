export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export enum ModelProvider {
  GOOGLE = 'google',
  OPENAI = 'openai'
}

export interface AppSettings {
  provider: ModelProvider;
  openAIKey: string;
}

export interface RetrievalMetric {
  latencyMs: number;
  tokensUsed: number;
  sourcesCount: number;
  modelName: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metrics?: RetrievalMetric;
  relatedSources?: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 string
  mimeType: string;
  status: 'uploading' | 'ready' | 'error';
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}