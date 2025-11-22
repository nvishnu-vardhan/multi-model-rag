import React, { useState } from 'react';
import { X, Save, Key, Cpu } from 'lucide-react';
import { AppSettings, ModelProvider } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [provider, setProvider] = useState<ModelProvider>(settings.provider);
  const [openAIKey, setOpenAIKey] = useState(settings.openAIKey);

  const handleSave = () => {
    onSave({ provider, openAIKey });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            Model Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Select Model Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProvider(ModelProvider.GOOGLE)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  provider === ModelProvider.GOOGLE
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Google Gemini
              </button>
              <button
                onClick={() => setProvider(ModelProvider.OPENAI)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  provider === ModelProvider.OPENAI
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                OpenAI GPT-4o
              </button>
            </div>
          </div>

          {provider === ModelProvider.OPENAI && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Key className="w-3 h-3" />
                OpenAI API Key
              </label>
              <input 
                type="password" 
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-2">
                Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          )}
          
          {provider === ModelProvider.GOOGLE && (
             <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-400">
                  Using default system API Key (Gemini 2.5 Flash). 
                </p>
             </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};