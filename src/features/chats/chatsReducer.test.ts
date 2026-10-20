import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from '../../api/types';
import { chatsReducer, initialChatsState, type ChatsState } from './chatsReducer';
import type { Chat, Message } from './types';

const incoming = (overrides: Partial<IncomingMessage> = {}): IncomingMessage => ({
  id: 'm1',
  chatId: '555',
  phone: null,
  senderName: null,
  text: 'привет',
  timestamp: 1000,
  ...overrides,
});

const outgoing = (id: string): Message => ({
  id,
  text: 'ответ',
  direction: 'out',
  timestamp: 2000,
  status: 'sending',
});

const chat = (overrides: Partial<Chat> = {}): Chat => ({
  id: 'c1',
  chatId: '555',
  phone: '79991234567',
  name: '+7 (999) 123-45-67',
  messages: [],
  unread: 0,
  ...overrides,
});

const withChats = (chats: Chat[], activeChatId: string | null = null): ChatsState => ({
  chats,
  activeChatId,
});

describe('chatCreated', () => {
  it('создаёт чат и делает его активным', () => {
    const state = chatsReducer(initialChatsState, {
      type: 'chatCreated',
      id: 'c1',
      chatId: '555',
      phone: '79991234567',
      resolved: true,
    });
    expect(state.activeChatId).toBe('c1');
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0]).toMatchObject({ chatId: '555', name: '+7 (999) 123-45-67' });
  });

  it('не дублирует чат с тем же номером, а уточняет его chatId', () => {
    const start = withChats([chat({ chatId: '79991234567@c.us' })]);
    const state = chatsReducer(start, {
      type: 'chatCreated',
      id: 'new',
      chatId: '555',
      phone: '79991234567',
      resolved: true,
    });
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0]?.chatId).toBe('555');
    expect(state.activeChatId).toBe('c1');
  });

  it('не затирает настоящий chatId запасным «номер@c.us»', () => {
    const state = chatsReducer(withChats([chat()]), {
      type: 'chatCreated',
      id: 'new',
      chatId: '79991234567@c.us',
      phone: '79991234567',
      resolved: false,
    });
    expect(state.chats[0]?.chatId).toBe('555');
  });
});

describe('incomingReceived', () => {
  it('кладёт сообщение в чат с тем же chatId и увеличивает счётчик', () => {
    const state = chatsReducer(withChats([chat()]), {
      type: 'incomingReceived',
      message: incoming(),
      newChatId: 'x',
    });
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0]?.messages).toHaveLength(1);
    expect(state.chats[0]?.unread).toBe(1);
  });

  it('находит чат по номеру, если chatId ещё не известен, и запоминает его', () => {
    const start = withChats([chat({ chatId: '79991234567@c.us' })]);
    const state = chatsReducer(start, {
      type: 'incomingReceived',
      message: incoming({ chatId: '555', phone: '79991234567' }),
      newChatId: 'x',
    });
    expect(state.chats).toHaveLength(1);
    expect(state.chats[0]?.chatId).toBe('555');
  });

  it('создаёт новый чат для незнакомого отправителя', () => {
    const state = chatsReducer(initialChatsState, {
      type: 'incomingReceived',
      message: incoming({ chatId: '777', senderName: 'Петя' }),
      newChatId: 'new',
    });
    expect(state.chats[0]).toMatchObject({ id: 'new', name: 'Петя', unread: 1 });
  });

  it('игнорирует повторную доставку того же сообщения', () => {
    const once = chatsReducer(withChats([chat()]), {
      type: 'incomingReceived',
      message: incoming(),
      newChatId: 'x',
    });
    const twice = chatsReducer(once, {
      type: 'incomingReceived',
      message: incoming(),
      newChatId: 'y',
    });
    expect(twice).toBe(once);
  });

  it('не копит непрочитанные в открытом чате', () => {
    const state = chatsReducer(withChats([chat()], 'c1'), {
      type: 'incomingReceived',
      message: incoming(),
      newChatId: 'x',
    });
    expect(state.chats[0]?.unread).toBe(0);
  });

  it('поднимает чат с новым сообщением наверх', () => {
    const start = withChats([chat({ id: 'a', chatId: '1', phone: null }), chat({ id: 'b' })]);
    const state = chatsReducer(start, {
      type: 'incomingReceived',
      message: incoming(),
      newChatId: 'x',
    });
    expect(state.chats.map((c) => c.id)).toEqual(['b', 'a']);
  });
});

describe('сообщения и выбор чата', () => {
  it('ставит исходящее сообщение в очередь и меняет статус', () => {
    let state = withChats([chat()], 'c1');
    state = chatsReducer(state, { type: 'messageQueued', chatId: 'c1', message: outgoing('m1') });
    expect(state.chats[0]?.messages[0]?.status).toBe('sending');

    state = chatsReducer(state, {
      type: 'messageStatusChanged',
      chatId: 'c1',
      messageId: 'm1',
      status: 'failed',
    });
    expect(state.chats[0]?.messages[0]?.status).toBe('failed');
  });

  it('сбрасывает непрочитанные при открытии чата', () => {
    const state = chatsReducer(withChats([chat({ unread: 3 })]), {
      type: 'chatSelected',
      id: 'c1',
    });
    expect(state.activeChatId).toBe('c1');
    expect(state.chats[0]?.unread).toBe(0);
  });
});
