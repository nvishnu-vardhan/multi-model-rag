import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { generateMultiModalResponse } from './services/llmService';
import { SettingsModal } from './components/SettingsModal';
import { AppState, ChatMessage as ChatMessageType, MessageRole, UploadedFile, AppSettings, ModelProvider } from './types';
import { Send, AlertCircle, Loader2, Menu, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Helper to safely access environment variables (Works for Vite, Next.js, and standard Webpack)
const getEnvKey = () => {
  try {
    // @ts-ignore - Vite support
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_OPENAI_API_KEY;
    }
    // @ts-ignore - Standard process.env support
    if (typeof process !== 'undefined' && process.env?.VITE_OPENAI_API_KEY) {
      // @ts-ignore
      return process.env.VITE_OPENAI_API_KEY;
    }
  } catch (e) {
    return '';
  }
  return '';
};

const ENV_OPENAI_KEY = getEnvKey();

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  
  // Initialize settings from LocalStorage OR Environment Variables
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mm_rag_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the saved key is empty but we have an Env Key, use the Env Key
      if (!parsed.openAIKey && ENV_OPENAI_KEY) {
        parsed.openAIKey = ENV_OPENAI_KEY;
      }
      return parsed;
    }
    // Default: Use Env Key if available
    return { 
      provider: ModelProvider.OPENAI, 
      openAIKey: ENV_OPENAI_KEY 
    };
  });
  
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      content: "Welcome to Multi Model RAG. \n\nI can analyze documents, charts, and images using advanced AI models. Upload your files and ask questions to get started.",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, appState]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('mm_rag_settings', JSON.stringify(newSettings));
  };

  const handleFileUpload = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFiles(prev => [...prev, {
            id: uuidv4(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result as string,
            mimeType: file.type,
            status: 'ready'
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || appState === AppState.PROCESSING) return;

    const userMsg: ChatMessageType = {
      id: uuidv4(),
      role: MessageRole.USER,
      content: inputValue,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputValue('');
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const response = await generateMultiModalResponse(
        chatHistory, 
        userMsg.content, 
        files, 
        settings.provider, 
        settings.openAIKey
      );
      
      const modelMsg: ChatMessageType = {
        id: uuidv4(),
        role: MessageRole.MODEL,
        content: response.text,
        timestamp: new Date(),
        metrics: response.metrics
      };

      setChatHistory(prev => [...prev, modelMsg]);
      setAppState(AppState.IDLE);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg(error.message || "An unexpected error occurred during the RAG pipeline execution.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {settingsOpen && (
        <SettingsModal 
          settings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setSettingsOpen(false)} 
        />
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-slate-900" onClick={e => e.stopPropagation()}>
             <div className="flex justify-end p-4">
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
             </div>
             <div className="h-full">
                <Sidebar 
                  files={files} 
                  onFileUpload={handleFileUpload} 
                  onRemoveFile={handleRemoveFile}
                  settings={settings}
                  onOpenSettings={() => {
                    setMobileMenuOpen(false);
                    setSettingsOpen(true);
                  }} 
                />
             </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar 
        files={files} 
        onFileUpload={handleFileUpload} 
        onRemoveFile={handleRemoveFile}
        settings={settings}
        onOpenSettings={() => setSettingsOpen(true)} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full relative">
        
        {/* Header (Mobile) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <div className="font-bold text-lg">Multi Model RAG</div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar bg-radial-gradient">
          <div className="max-w-3xl mx-auto">
            {chatHistory.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {appState === AppState.PROCESSING && (
              <div className="flex items-center gap-3 text-slate-500 ml-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm font-mono">
                  Analyzing with {settings.provider === ModelProvider.GOOGLE ? 'Gemini' : 'GPT-4o'}...
                </span>
              </div>
            )}
            
            {appState === AppState.ERROR && errorMsg && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur border-t border-slate-800">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-slate-800/50 border border-slate-700 rounded-xl p-2 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-lg">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about your documents..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none h-14 max-h-32 py-3 px-3 text-sm text-slate-200 placeholder-slate-500 custom-scrollbar"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || appState === AppState.PROCESSING}
                className="p-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-all flex-shrink-0 mb-1"
              >
                {appState === AppState.PROCESSING ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="text-center mt-2">
               <p className="text-[10px] text-slate-600">
                 Multi Model RAG. Output accuracy depends on document clarity and selected model.
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;