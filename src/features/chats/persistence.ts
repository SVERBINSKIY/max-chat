import { readJson, writeJson } from '../../lib/storage';
import { initialChatsState, type ChatsState } from './chatsReducer';
import type { Chat } from './types';

const storageKey = (idInstance: string) => `max-chat:v1:chats:${idInstance}`;

export function loadChatsState(idInstance: string): ChatsState {
  const saved = readJson<Chat[]>(localStorage, storageKey(idInstance));
  if (!Array.isArray(saved)) return initialChatsState;

  const chats = saved.map((chat) => ({
    ...chat,
    messages: chat.messages.map((message) =>
      message.status === 'sending' ? { ...message, status: 'failed' as const } : message,
    ),
  }));
  return { chats, activeChatId: null };
}

export function saveChats(idInstance: string, chats: Chat[]): void {
  writeJson(localStorage, storageKey(idInstance), chats);
}
