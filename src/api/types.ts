export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl?: string;
}

export interface InstanceSettings {
  incomingWebhook?: string;
  webhookUrl?: string;
}

export interface CheckAccountResult {
  exist: boolean;
  chatId?: string;
}

export interface ReceivedNotification {
  receiptId: number;
  body: unknown;
}

export interface IncomingMessage {
  id: string;
  chatId: string;
  phone: string | null;
  senderName: string | null;
  text: string;
  timestamp: number;
}
