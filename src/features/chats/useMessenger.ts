import { useCallback, useEffect, useReducer } from 'react';
import type { GreenApiClient } from '../../api/client';
import type { IncomingMessage } from '../../api/types';
import { createId } from '../../lib/async';
import { chatsReducer } from './chatsReducer';
import { loadChatsState, saveChats } from './persistence';
import type { Message } from './types';
import { useNotificationPolling } from './useNotificationPolling';

export function useMessenger(client: GreenApiClient, idInstance: string) {
  const [state, dispatch] = useReducer(chatsReducer, idInstance, loadChatsState);
  const { chats, activeChatId } = state;

  useEffect(() => saveChats(idInstance, chats), [idInstance, chats]);

  const handleIncoming = useCallback(
    (message: IncomingMessage) =>
      dispatch({ type: 'incomingReceived', message, newChatId: createId() }),
    [],
  );
  const connection = useNotificationPolling(client, handleIncoming);

  const selectChat = useCallback((id: string | null) => dispatch({ type: 'chatSelected', id }), []);

  const createChat = useCallback(
    async (phone: string) => {
      let chatId = `${phone}@c.us`;
      let resolved = false;

      try {
        const result = await client.checkAccount(phone);
        if (result?.exist && result.chatId) {
          chatId = result.chatId;
          resolved = true;
        }
      } catch {
        // catch
      }

      dispatch({ type: 'chatCreated', id: createId(), chatId, phone, resolved });
    },
    [client],
  );

  const deliver = useCallback(
    async (chatId: string, recipient: string, message: Message) => {
      let status: Message['status'] = 'sent';
      try {
        await client.sendMessage(recipient, message.text);
      } catch {
        status = 'failed';
      }
      dispatch({ type: 'messageStatusChanged', chatId, messageId: message.id, status });
    },
    [client],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const chat = chats.find((c) => c.id === activeChatId);
      const trimmed = text.trim();
      if (!chat || !trimmed) return;

      const message: Message = {
        id: createId(),
        text: trimmed,
        direction: 'out',
        timestamp: Date.now(),
        status: 'sending',
      };
      dispatch({ type: 'messageQueued', chatId: chat.id, message });
      void deliver(chat.id, chat.chatId, message);
    },
    [chats, activeChatId, deliver],
  );

  const retryMessage = useCallback(
    (messageId: string) => {
      const chat = chats.find((c) => c.id === activeChatId);
      const message = chat?.messages.find((m) => m.id === messageId);
      if (!chat || !message) return;

      dispatch({ type: 'messageStatusChanged', chatId: chat.id, messageId, status: 'sending' });
      void deliver(chat.id, chat.chatId, message);
    },
    [chats, activeChatId, deliver],
  );

  return {
    chats,
    activeChat: chats.find((chat) => chat.id === activeChatId) ?? null,
    connection,
    selectChat,
    createChat,
    sendMessage,
    retryMessage,
  };
}
