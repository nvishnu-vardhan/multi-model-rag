import React, { useCallback } from 'react';
import { UploadedFile, AppSettings, ModelProvider } from '../types';
import { Upload, FileText, Image as ImageIcon, Trash2, Database, Cpu, Settings, Layers } from 'lucide-react';

interface SidebarProps {
  files: UploadedFile[];
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  onOpenSettings: () => void;
  settings: AppSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ files, onFileUpload, onRemoveFile, onOpenSettings, settings }) => {
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  }, [onFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate">
            Multi Model RAG
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Unified Document Intelligence
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            Ingestion Pipeline
          </h2>
          
          <div 
            className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-blue-500/20 mx-auto flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Click or drag documents
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDFs, Images (PNG/JPG)
            </p>
            <input 
              type="file" 
              id="file-upload" 
              multiple 
              className="hidden" 
              onChange={(e) => onFileUpload(e.target.files)}
              accept="image/*,.pdf,.txt,.md"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Knowledge Base</span>
            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">
              {files.length}
            </span>
          </h2>
          
          <div className="space-y-2">
            {files.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm italic">
                No documents indexed.
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-start gap-3 group hover:border-slate-600 transition-colors">
                  <div className="mt-1">
                    {file.type.startsWith('image') ? (
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{(file.size / 1024).toFixed(0)} KB</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span className="text-green-400">Ready</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${settings.provider === ModelProvider.GOOGLE ? 'bg-blue-500' : 'bg-green-500'}`} />
             <div className="flex flex-col items-start">
                <span className="text-xs text-slate-300 font-medium">
                  {settings.provider === ModelProvider.GOOGLE ? 'Gemini 2.5' : 'GPT-4o'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {settings.provider === ModelProvider.GOOGLE ? 'Default Key' : 'Custom Key'}
                </span>
             </div>
          </div>
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>
    </aside>
  );
};