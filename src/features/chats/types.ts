export type MessageStatus = 'sending' | 'sent' | 'failed' | 'received';

export interface Message {
  id: string;
  text: string;
  direction: 'in' | 'out';
  timestamp: number;
  status: MessageStatus;
}

export interface Chat {
  id: string;
  chatId: string;
  phone: string | null;
  name: string;
  messages: Message[];
  unread: number;
}
