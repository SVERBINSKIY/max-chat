import { useState } from 'react';
import type { Credentials } from './api/types';
import { Login } from './components/Login';
import { Messenger } from './components/Messenger';
import { clearSession, loadSession, saveSession } from './features/auth/session';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadSession);

  if (!credentials) {
    return (
      <Login
        onLogin={(next, remember) => {
          saveSession(next, remember);
          setCredentials(next);
        }}
      />
    );
  }

  return (
    <Messenger
      key={credentials.idInstance}
      credentials={credentials}
      onLogout={() => {
        clearSession();
        setCredentials(null);
      }}
    />
  );
}
