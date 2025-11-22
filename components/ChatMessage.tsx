import React from 'react';
import { ChatMessage as ChatMessageType, MessageRole } from '../types';
import { Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MetricCard } from './MetricCard';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-in`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-lg ${
          isUser 
            ? 'bg-slate-700' 
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          {isUser ? <User className="w-5 h-5 text-slate-300" /> : <Bot className="w-5 h-5 text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-5 py-4 rounded-2xl shadow-md ${
            isUser 
              ? 'bg-slate-800 text-slate-100 rounded-tr-sm border border-slate-700' 
              : 'bg-slate-900/80 text-slate-200 rounded-tl-sm border border-slate-800 backdrop-blur-sm'
          }`}>
            {/* Message Body */}
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>

            {/* Source Attribution / Metrics (Only for Model) */}
            {!isUser && message.metrics && (
               <div className="mt-4 pt-3 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">RAG Analysis</span>
                  </div>
                  <MetricCard metrics={message.metrics} />
               </div>
            )}
          </div>
          
          <span className="text-[10px] text-slate-600 mt-2 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};