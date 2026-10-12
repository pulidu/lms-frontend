import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';
import api from '../services/api.js';
import toast from 'react-hot-toast';

interface Message {
  sender: 'student' | 'ai';
  text: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Hello! I am your AI Academic Assistant. Ask me about your **GPA**, **attendance**, **grades**, or **pending assignments**!' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    setMessages((prev) => [...prev, { sender: 'student', text: textToSend }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: textToSend });
      setMessages((prev) => [...prev, { sender: 'ai', text: response.data.response }]);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to get response from AI assistant');
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'I am sorry, I am having trouble connecting to my knowledge base right now. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What is my GPA?',
    'Check my attendance',
    'What marks do I have?',
    'What assignments are pending?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300">
      {/* Drawer Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 bg-white text-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-slate-900" />
          <h2 className="font-semibold text-sm tracking-wide text-slate-900">AI Academic Assistant</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-all cursor-pointer z-50"
          title="Close AI Assistant"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Box */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex gap-2.5 max-w-[85%]">
              {msg.sender === 'ai' && (
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 border border-slate-200">
                  <Bot className="h-4 w-4 text-slate-800" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'student'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.sender === 'student' && (
                <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 border border-slate-250/50 animate-pulse">
                <Bot className="h-4 w-4 text-slate-800" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-none border border-slate-250/50 px-4 py-3 text-sm text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Pills */}
      <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-wrap gap-2">
        {quickPrompts.map((prompt, index) => (
          <button
            key={index}
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input panel */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me something..."
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-slate-900 hover:bg-black text-white p-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatbot;
