import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGreenApiClient } from './client';
import { GreenApiError } from './errors';

const credentials = { idInstance: '123', apiTokenInstance: 'token' };

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('createGreenApiClient', () => {
  it('формирует адрес и тело SendMessage', async () => {
    const fetchMock = mockFetch(new Response('{"idMessage":"1"}'));

    await createGreenApiClient(credentials).sendMessage('79991234567@c.us', 'привет');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstance123/sendMessage/token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chatId: '79991234567@c.us', message: 'привет' }),
      }),
    );
  });

  it('использует свой apiUrl без завершающего слэша', async () => {
    const fetchMock = mockFetch(new Response('{"stateInstance":"authorized"}'));

    const state = await createGreenApiClient({
      ...credentials,
      apiUrl: 'https://3100.api.green-api.com/',
    }).getStateInstance();

    expect(state).toBe('authorized');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://3100.api.green-api.com/waInstance123/getStateInstance/token',
    );
  });

  it('передаёт номер в CheckAccount числом', async () => {
    const fetchMock = mockFetch(new Response('{"exist":true,"chatId":"555"}'));

    const result = await createGreenApiClient(credentials).checkAccount('79991234567');

    expect(result).toEqual({ exist: true, chatId: '555' });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({ phoneNumber: 79991234567 });
  });

  it('пустой ответ receiveNotification означает пустую очередь', async () => {
    mockFetch(new Response(''));
    const notification = await createGreenApiClient(credentials).receiveNotification(
      new AbortController().signal,
    );
    expect(notification).toBeNull();
  });

  it('удаляет уведомление по receiptId', async () => {
    const fetchMock = mockFetch(new Response('{"result":true}'));
    await createGreenApiClient(credentials).deleteNotification(42);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.green-api.com/waInstance123/deleteNotification/token/42',
      { method: 'DELETE' },
    );
  });

  it.each([
    [401, /Неверные idInstance/],
    [466, /лимит тарифа/],
    [429, /Слишком много/],
    [500, /HTTP 500/],
  ])('превращает HTTP %i в понятную ошибку', async (status, message) => {
    mockFetch(new Response('', { status }));
    const request = createGreenApiClient(credentials).getSettings();
    await expect(request).rejects.toBeInstanceOf(GreenApiError);
    await expect(request).rejects.toThrow(message);
  });

  it('сообщает о проблемах с сетью', async () => {
    mockFetch(new TypeError('Failed to fetch'));
    await expect(createGreenApiClient(credentials).getSettings()).rejects.toThrow(/Нет связи/);
  });
});
