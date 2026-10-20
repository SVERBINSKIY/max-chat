import type { Credentials } from '../../api/types';
import { readJson, writeJson } from '../../lib/storage';

const KEY = 'max-chat:v1:credentials';

function isCredentials(value: unknown): value is Credentials {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Credentials).idInstance === 'string' &&
    typeof (value as Credentials).apiTokenInstance === 'string'
  );
}

export function loadSession(): Credentials | null {
  const saved = readJson<unknown>(localStorage, KEY) ?? readJson<unknown>(sessionStorage, KEY);
  return isCredentials(saved) ? saved : null;
}

export function saveSession(credentials: Credentials, remember: boolean): void {
  clearSession();
  writeJson(remember ? localStorage : sessionStorage, KEY, credentials);
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}
