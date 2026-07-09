import { useState } from 'react';
import { Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) {
      setStatus('error');
      setError(error.message);
      return;
    }
    setStatus('sent');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-medium text-ink">裝潢家居參考</h1>
        <p className="mb-5 text-sm text-ink-light">輸入 email,我們會寄送登入連結給你</p>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Mail size={28} className="text-sage" />
            <p className="text-sm text-ink">
              已寄出登入連結到 <span className="font-medium">{email}</span>
            </p>
            <p className="text-xs text-ink-light">請到信箱點擊連結完成登入</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
            />
            {status === 'error' && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-full bg-sage py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === 'sending' ? '寄送中...' : '寄送登入連結'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
