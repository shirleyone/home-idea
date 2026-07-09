import { useState } from 'react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import loginBg from '../assets/login-bg.jpg';
import { FlowerLogo } from './FlowerLogo';

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
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <div className="h-[42vh] w-full shrink-0 overflow-hidden rounded-b-[2.5rem] md:h-screen md:w-1/2 md:rounded-none">
        <img src={loginBg} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col justify-center bg-cream px-8 py-10 md:px-16">
        <div className="mx-auto w-full max-w-sm md:mx-0">
          <div className="mb-8 flex items-center gap-2">
            <FlowerLogo size={36} />
            <span className="font-rounded text-lg font-semibold text-ink">DecoMinds</span>
          </div>

          <h1 className="mb-2 text-2xl font-black text-ink md:text-3xl">登入你的裝潢靈感牆</h1>
          <p className="mb-8 text-sm text-ink-light">隨時回來翻找靈感</p>

          {status === 'sent' ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl bg-sage-light/50 p-5 text-left">
              <Mail size={28} className="text-tag" />
              <p className="text-sm text-ink">
                已寄出登入連結到 <span className="font-medium">{email}</span>
              </p>
              <p className="text-xs text-ink-light">請到信箱點擊連結完成登入</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-ink">
                電子信箱
              </label>
              <div className="relative mb-4">
                <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-light" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-light/60 focus:border-tag"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-tag py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {status === 'sending' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    寄送登入連結
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {status === 'error' && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <p className="mt-4 text-center text-xs text-ink-light">首次登入將自動建立帳號</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
