import { useId, useState, type FormEvent } from 'react';
import { createGreenApiClient } from '../api/client';
import { describeError } from '../api/errors';
import type { Credentials } from '../api/types';
import shared from './shared.module.css';
import styles from './Login.module.css';

interface LoginProps {
  onLogin: (credentials: Credentials, remember: boolean) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim() || undefined,
    };

    if (!/^\d+$/.test(credentials.idInstance)) {
      setError('idInstance состоит только из цифр.');
      return;
    }

    setLoading(true);
    try {
      const state = await createGreenApiClient(credentials).getStateInstance();
      if (state === 'authorized') {
        onLogin(credentials, remember);
        return;
      }
      setError(`Инстанс не авторизован (состояние: ${state}). Отсканируйте QR-код в кабинете.`);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
        aria-describedby={error ? errorId : undefined}
      >
        <h1 className={styles.title}>Вход в чат</h1>
        <p className={styles.hint}>
          Данные инстанса из личного кабинета{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            GREEN-API
          </a>
        </p>

        <label className={styles.field}>
          idInstance
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            required
            autoFocus
          />
        </label>

        <label className={styles.field}>
          apiTokenInstance
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            autoComplete="off"
            required
          />
        </label>

        <details className={styles.advanced}>
          <summary>Дополнительно</summary>
          <label className={styles.field}>
            apiUrl
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.green-api.com"
              autoComplete="off"
            />
          </label>
        </details>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Запомнить на этом устройстве
        </label>

        {error && (
          <p id={errorId} className={shared.error} role="alert">
            {error}
          </p>
        )}

        <button className={shared.primaryButton} type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
