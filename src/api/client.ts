import { GreenApiError } from './errors';
import type {
  CheckAccountResult,
  Credentials,
  InstanceSettings,
  ReceivedNotification,
} from './types';

const DEFAULT_API_URL = 'https://api.green-api.com';

export function createGreenApiClient(credentials: Credentials) {
  const root = (credentials.apiUrl?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
  const endpoint = (method: string, suffix = '') =>
    `${root}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${suffix}`;

  async function request<T>(url: string, init?: RequestInit): Promise<T | null> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if (init?.signal?.aborted) throw error;
      throw new GreenApiError('Нет связи с GREEN-API. Проверьте интернет и значение apiUrl.');
    }

    const text = await response.text();
    if (!response.ok) throw GreenApiError.fromResponse(response.status, text);
    if (!text) return null;

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new GreenApiError('GREEN-API вернул некорректный ответ.', response.status);
    }
  }

  const post = <T>(method: string, body: unknown) =>
    request<T>(endpoint(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  return {
    async getStateInstance(): Promise<string> {
      const data = await request<{ stateInstance: string }>(endpoint('getStateInstance'));
      return data?.stateInstance ?? 'unknown';
    },

    getSettings: () => request<InstanceSettings>(endpoint('getSettings')),

    checkAccount: (phone: string) =>
      post<CheckAccountResult>('checkAccount', { phoneNumber: Number(phone) }),

    async sendMessage(chatId: string, message: string): Promise<void> {
      await post('sendMessage', { chatId, message });
    },

    receiveNotification: (signal: AbortSignal) =>
      request<ReceivedNotification>(`${endpoint('receiveNotification')}?receiveTimeout=5`, {
        signal,
      }),

    async deleteNotification(receiptId: number): Promise<void> {
      await request(endpoint('deleteNotification', `/${receiptId}`), { method: 'DELETE' });
    },
  };
}

export type GreenApiClient = ReturnType<typeof createGreenApiClient>;
