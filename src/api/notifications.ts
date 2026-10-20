import type { IncomingMessage } from './types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

function extractText(messageData: UnknownRecord): string | null {
  switch (messageData.typeMessage) {
    case 'textMessage':
      return isRecord(messageData.textMessageData)
        ? asString(messageData.textMessageData.textMessage)
        : null;
    case 'extendedTextMessage':
      return isRecord(messageData.extendedTextMessageData)
        ? asString(messageData.extendedTextMessageData.text)
        : null;
    default:
      return null;
  }
}

export function parseIncomingMessage(body: unknown): IncomingMessage | null {
  if (!isRecord(body) || body.typeWebhook !== 'incomingMessageReceived') return null;
  if (!isRecord(body.senderData) || !isRecord(body.messageData)) return null;

  const id = asString(body.idMessage);
  const chatId = asString(body.senderData.chatId);
  const text = extractText(body.messageData);
  if (!id || !chatId || !text) return null;

  const phone = body.senderData.senderPhoneNumber;
  const timestamp = typeof body.timestamp === 'number' ? body.timestamp * 1000 : Date.now();

  return {
    id,
    chatId,
    phone: phone ? String(phone) : null,
    senderName:
      asString(body.senderData.senderContactName) ??
      asString(body.senderData.senderName) ??
      asString(body.senderData.chatName),
    text,
    timestamp,
  };
}
