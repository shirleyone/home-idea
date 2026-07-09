import { Loader2 } from 'lucide-react';
import { HomeApp } from './HomeApp';
import { Login } from './components/Login';
import { useSession } from './useSession';

export default function App() {
  const session = useSession();

  if (session === undefined) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-cream text-ink-light">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (session === null) {
    return <Login />;
  }

  return <HomeApp userEmail={session.user.email} />;
}
