import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

interface FakeServer {
  settings: Record<string, string>;
  queue: unknown[];
  sent: { chatId: string; message: string }[];
  failSend: boolean;
  polls: number;
  deleted: number[];
}

let server: FakeServer;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function installFakeServer() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      if (url.includes('/getStateInstance/')) return json({ stateInstance: 'authorized' });
      if (url.includes('/getSettings/')) return json(server.settings);
      if (url.includes('/checkAccount/')) return json({ exist: true, chatId: '555' });
      if (url.includes('/sendMessage/')) {
        if (server.failSend) return json({}, 500);
        server.sent.push(JSON.parse(init.body as string));
        return json({ idMessage: `id-${server.sent.length}` });
      }
      if (url.includes('/deleteNotification/')) {
        server.deleted.push(Number(url.split('/').pop()));
        return json({ result: true });
      }
      if (url.includes('/receiveNotification/')) {
        server.polls += 1;
        const next = server.queue.shift();
        if (next) return json(next);
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 30);
          init.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
        return new Response('');
      }
      return json({}, 404);
    }),
  );
}

const textNotification = (receiptId: number, idMessage: string, chatId: string, text: string) => ({
  receiptId,
  body: {
    typeWebhook: 'incomingMessageReceived',
    idMessage,
    timestamp: 1_763_115_112,
    senderData: { chatId, senderName: 'Вася' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
  },
});

async function login() {
  fireEvent.change(screen.getByLabelText('idInstance'), { target: { value: '41000' } });
  fireEvent.change(screen.getByLabelText('apiTokenInstance'), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
  await screen.findByRole('heading', { name: 'Чаты' });
}

async function createChat(phone: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));
  fireEvent.change(screen.getByLabelText('Номер телефона получателя'), {
    target: { value: phone },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Создать чат' }));
  await screen.findByLabelText('Сообщение');
}

function send(text: string) {
  fireEvent.change(screen.getByLabelText('Сообщение'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  server = {
    settings: { incomingWebhook: 'yes', webhookUrl: '' },
    queue: [],
    sent: [],
    failSend: false,
    polls: 0,
    deleted: [],
  };
  installFakeServer();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('чат', () => {
  it('вход → новый чат → отправка → ответ в тот же чат', async () => {
    render(<App />);
    await login();
    await createChat('+375 33 641-48-49');

    send('привет');
    await waitFor(() => expect(server.sent).toEqual([{ chatId: '555', message: 'привет' }]));
    await screen.findByTitle('Отправлено');

    server.queue.push(textNotification(1, 'A1', '555', 'здарова'));
    const log = screen.getByRole('log');
    await waitFor(() => expect(log.textContent).toContain('здарова'));

    expect(server.deleted).toContain(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('повторно доставленное уведомление не дублирует сообщение', async () => {
    render(<App />);
    await login();
    await createChat('375336414849');

    server.queue.push(
      textNotification(1, 'A1', '555', 'раз'),
      textNotification(2, 'A1', '555', 'раз'),
    );
    await waitFor(() => expect(server.deleted).toEqual([1, 2]));

    expect(screen.getByRole('log').textContent?.match(/раз/g)).toHaveLength(1);
  });

  it('сообщение от незнакомого отправителя создаёт чат со счётчиком', async () => {
    render(<App />);
    await login();

    server.queue.push(textNotification(1, 'B1', '777', 'новое'));
    await screen.findByText('Вася');
    expect(screen.getByLabelText('Непрочитанных: 1')).toBeTruthy();
  });

  it('при ошибке отправки даёт повторить', async () => {
    render(<App />);
    await login();
    await createChat('375336414849');

    server.failSend = true;
    send('не дойдёт');
    const retry = await screen.findByRole('button', { name: /Повторить/ });

    server.failSend = false;
    fireEvent.click(retry);
    await screen.findByTitle('Отправлено');
    expect(server.sent).toEqual([{ chatId: '555', message: 'не дойдёт' }]);
  });

  it('подсказывает, если выключены входящие уведомления', async () => {
    server.settings = { incomingWebhook: 'no', webhookUrl: '' };
    render(<App />);
    await login();
    await screen.findByText(/ответы приходить не будут/);
  });

  it('восстанавливает чаты после перезагрузки и останавливает опрос при выходе', async () => {
    const first = render(<App />);
    await login();
    await createChat('375336414849');
    send('сохранится');
    await screen.findByTitle('Отправлено');
    first.unmount();

    render(<App />);
    await screen.findByRole('heading', { name: 'Чаты' });
    expect(screen.getByText('Вы: сохранится')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Выйти' }));
    await screen.findByRole('heading', { name: 'Вход в чат' });

    const pollsAfterLogout = server.polls;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(server.polls).toBe(pollsAfterLogout);
  });

  it('не пускает с неавторизованным инстансом', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ stateInstance: 'notAuthorized' })),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText('idInstance'), { target: { value: '41000' } });
    fireEvent.change(screen.getByLabelText('apiTokenInstance'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain('notAuthorized');
  });
});
