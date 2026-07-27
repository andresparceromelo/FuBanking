'use client';

import { useState } from 'react';
import { Search, User, ArrowRight, AtSign, Hash } from 'lucide-react';
import { RecipientInfo } from '../types/transfer.types';
import { useTransfer } from '../hooks/useTransfer';

interface RecipientSearchProps {
  onRecipientFound: (recipient: RecipientInfo) => void;
}

type SearchMode = 'account' | 'email';

export function RecipientSearch({ onRecipientFound }: RecipientSearchProps) {
  const [mode, setMode]         = useState<SearchMode>('account');
  const [query, setQuery]       = useState('');
  const [recipient, setRecipient] = useState<RecipientInfo | null>(null);
  const { isLoading, error, clearError, searchByAccountNumber, searchByEmail } = useTransfer();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setRecipient(null);
    const result = mode === 'account'
      ? await searchByAccountNumber(query.trim())
      : await searchByEmail(query.trim());
    if (result) setRecipient(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Enviar dinero</h2>
        <p className="text-sm text-white/50 mt-1">Busca al destinatario por numero de cuenta o correo</p>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
        {([['account', Hash, 'Numero de cuenta'], ['email', AtSign, 'Correo']] as const).map(([m, Icon, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setQuery(''); setRecipient(null); clearError(); }}
            className={`flex items-center gap-2 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-all ${
              mode === m
                ? 'bg-primary text-white shadow-lg'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Campo de busqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type={mode === 'email' ? 'email' : 'text'}
          placeholder={mode === 'account' ? 'Ej: 0019283746' : 'Ej: carlos@gmail.com'}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setRecipient(null); clearError(); }}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition"
        />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
        className="w-full py-3 rounded-2xl bg-primary text-white font-semibold disabled:opacity-40 transition hover:opacity-90 active:scale-[0.98]"
      >
        {isLoading ? 'Buscando...' : 'Buscar destinatario'}
      </button>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      {/* Resultado */}
      {recipient && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <User size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{recipient.name}</p>
              <p className="text-emerald-300 text-sm font-mono">{recipient.accountNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRecipientFound(recipient)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 transition"
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
