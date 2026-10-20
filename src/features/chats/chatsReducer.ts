import type { IncomingMessage } from '../../api/types';
import { formatPhone } from '../../lib/phone';
import type { Chat, Message, MessageStatus } from './types';

export interface ChatsState {
  chats: Chat[];
  activeChatId: string | null;
}

export const initialChatsState: ChatsState = { chats: [], activeChatId: null };

export type ChatsAction =
  | { type: 'chatCreated'; id: string; chatId: string; phone: string; resolved: boolean }
  | { type: 'chatSelected'; id: string | null }
  | { type: 'messageQueued'; chatId: string; message: Message }
  | { type: 'messageStatusChanged'; chatId: string; messageId: string; status: MessageStatus }
  | { type: 'incomingReceived'; message: IncomingMessage; newChatId: string };

const updateChat = (chats: Chat[], id: string, update: (chat: Chat) => Chat): Chat[] =>
  chats.map((chat) => (chat.id === id ? update(chat) : chat));

const moveToFront = (chats: Chat[], id: string): Chat[] => {
  const chat = chats.find((c) => c.id === id);
  return chat ? [chat, ...chats.filter((c) => c.id !== id)] : chats;
};

export function chatsReducer(state: ChatsState, action: ChatsAction): ChatsState {
  switch (action.type) {
    case 'chatCreated': {
      const existing = state.chats.find(
        (chat) => chat.phone === action.phone || chat.chatId === action.chatId,
      );

      if (existing) {
        const chats = updateChat(state.chats, existing.id, (chat) => ({
          ...chat,
          chatId: action.resolved ? action.chatId : chat.chatId,
          phone: action.phone,
          unread: 0,
        }));
        return { chats, activeChatId: existing.id };
      }

      const chat: Chat = {
        id: action.id,
        chatId: action.chatId,
        phone: action.phone,
        name: formatPhone(action.phone),
        messages: [],
        unread: 0,
      };
      return { chats: [chat, ...state.chats], activeChatId: chat.id };
    }

    case 'chatSelected': {
      const { id } = action;
      const chats = id
        ? updateChat(state.chats, id, (chat) => ({ ...chat, unread: 0 }))
        : state.chats;
      return { chats, activeChatId: id };
    }

    case 'messageQueued': {
      const chats = updateChat(state.chats, action.chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, action.message],
      }));
      return { ...state, chats: moveToFront(chats, action.chatId) };
    }

    case 'messageStatusChanged': {
      const chats = updateChat(state.chats, action.chatId, (chat) => ({
        ...chat,
        messages: chat.messages.map((message) =>
          message.id === action.messageId ? { ...message, status: action.status } : message,
        ),
      }));
      return { ...state, chats };
    }

    case 'incomingReceived': {
      const { message: incoming, newChatId } = action;
      const message: Message = {
        id: incoming.id,
        text: incoming.text,
        direction: 'in',
        timestamp: incoming.timestamp,
        status: 'received',
      };

      const chat = state.chats.find(
        (c) =>
          c.chatId === incoming.chatId || (incoming.phone !== null && c.phone === incoming.phone),
      );

      if (!chat) {
        const created: Chat = {
          id: newChatId,
          chatId: incoming.chatId,
          phone: incoming.phone,
          name:
            incoming.senderName ?? (incoming.phone ? formatPhone(incoming.phone) : incoming.chatId),
          messages: [message],
          unread: 1,
        };
        return { ...state, chats: [created, ...state.chats] };
      }

      if (chat.messages.some((m) => m.id === incoming.id)) return state;

      const isActive = chat.id === state.activeChatId;
      const chats = updateChat(state.chats, chat.id, (c) => ({
        ...c,
        chatId: incoming.chatId,
        phone: c.phone ?? incoming.phone,
        name: incoming.senderName ?? c.name,
        messages: [...c.messages, message],
        unread: isActive ? 0 : c.unread + 1,
      }));
      return { ...state, chats: moveToFront(chats, chat.id) };
    }
  }
}
