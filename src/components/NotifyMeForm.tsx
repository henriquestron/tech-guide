'use client';

import { useState } from 'react';
import { Bell, CheckCircle, Loader2, Send } from 'lucide-react';

export default function NotifyMeForm({ term }: { term: string }) {
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.trim()) return;

    setStatus('loading');
    
    try {
      const res = await fetch('/api/save-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, contact })
      });

      if (res.ok) {
          setStatus('success');
          setContact(''); // Limpa o campo
      } else {
          setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-pulse">
        <div className="flex justify-center mb-2">
          <CheckCircle className="text-green-500 w-12 h-12" />
        </div>
        <h3 className="text-green-500 font-bold text-lg">Recebemos seu pedido!</h3>
        <p className="text-zinc-400 text-sm mt-1">
          Assim que encontrarmos <strong>"{term}"</strong>, você será o primeiro a saber.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center max-w-md mx-auto shadow-2xl mt-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/30 text-blue-400 mb-4 ring-4 ring-blue-900/10">
        <Bell size={24} />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">Não encontrou o que queria?</h3>
      <p className="text-zinc-400 text-sm mb-6">
        Nossa IA já anotou seu interesse em <strong>"{term}"</strong>. <br/>
        Deixe seu <strong>WhatsApp ou Email</strong> que te avisamos assim que chegar!
      </p>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Digite seu contato (Zap ou Email)..."
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-zinc-600"
        />
        <button 
          type="submit" 
          disabled={status === 'loading' || !contact}
          className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
      
      {status === 'error' && (
        <p className="text-red-400 text-xs mt-3">Ops, algo deu errado. Tente novamente.</p>
      )}
    </div>
  );
}