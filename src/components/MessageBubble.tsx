import type { Message } from '../features/chats/types';
import { formatTime } from '../lib/format';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message;
  onRetry: (messageId: string) => void;
}

const STATUS_MARK: Partial<Record<Message['status'], { text: string; label: string }>> = {
  sending: { text: '…', label: 'Отправляется' },
  sent: { text: '✓', label: 'Отправлено' },
};

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const mark = STATUS_MARK[message.status];

  return (
    <div
      className={styles.bubble}
      data-direction={message.direction}
      data-failed={message.status === 'failed'}
    >
      <span className={styles.text}>{message.text}</span>
      <span className={styles.meta}>
        <time>{formatTime(message.timestamp)}</time>
        {mark && <span title={mark.label}>{mark.text}</span>}
      </span>
      {message.status === 'failed' && (
        <button type="button" className={styles.retry} onClick={() => onRetry(message.id)}>
          Не отправлено. Повторить
        </button>
      )}
    </div>
  );
}
