import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function Chat({ session }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I've analysed your dataset. Ask me anything about it — trends, specific columns, recommendations, anything you're curious about."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          message: msg,
          history,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Chat with your Data</h2>
        <p className="text-slate-400 text-sm">Ask questions about your dataset in plain English.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isStreamingLast = !isUser && i === messages.length - 1 && loading && msg.content !== '';
          return (
            <div key={i} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                isUser ? 'bg-cyan-500' : 'bg-slate-700'
              }`}>
                {isUser ? <User size={13} className="text-slate-950" /> : <Bot size={13} className="text-slate-300" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                isUser
                  ? 'bg-cyan-500/10 border border-cyan-500/20 text-slate-200'
                  : msg.isError
                  ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                  : 'bg-dash-800 border border-slate-700/50 text-slate-300'
              } ${isStreamingLast ? 'streaming-cursor' : ''}`}>
                <span className="whitespace-pre-wrap">
                  {msg.content || (loading && i === messages.length - 1
                    ? <span className="text-slate-500">Thinking…</span>
                    : null)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your data…"
          disabled={loading}
          className="flex-1 bg-dash-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-11 h-11 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
