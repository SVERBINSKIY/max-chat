import { describe, expect, it } from 'vitest';
import { parseIncomingMessage } from './notifications';

const base = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'ABC',
  timestamp: 1_763_115_112,
  senderData: {
    chatId: '10000000',
    senderName: 'Василиса',
    senderContactName: 'Василиса Премудрая',
    senderPhoneNumber: 79876543210,
  },
};

describe('parseIncomingMessage', () => {
  it('разбирает текстовое сообщение', () => {
    const body = {
      ...base,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    };
    expect(parseIncomingMessage(body)).toEqual({
      id: 'ABC',
      chatId: '10000000',
      phone: '79876543210',
      senderName: 'Василиса Премудрая',
      text: 'Привет',
      timestamp: 1_763_115_112_000,
    });
  });

  it('разбирает сообщение со ссылкой', () => {
    const body = {
      ...base,
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'смотри https://example.com' },
      },
    };
    expect(parseIncomingMessage(body)?.text).toBe('смотри https://example.com');
  });

  it('допускает отсутствие номера телефона', () => {
    const body = {
      ...base,
      senderData: { chatId: '1' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'x' } },
    };
    expect(parseIncomingMessage(body)).toMatchObject({ phone: null, senderName: null });
  });

  it('игнорирует вложения, статусы и мусор', () => {
    expect(
      parseIncomingMessage({ ...base, messageData: { typeMessage: 'imageMessage' } }),
    ).toBeNull();
    expect(parseIncomingMessage({ typeWebhook: 'outgoingMessageStatus' })).toBeNull();
    expect(parseIncomingMessage(null)).toBeNull();
    expect(parseIncomingMessage('text')).toBeNull();
  });
});
