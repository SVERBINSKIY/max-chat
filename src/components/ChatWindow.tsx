import { useEffect, useRef } from 'react';
import type { Chat } from '../features/chats/types';
import { formatPhone } from '../lib/phone';
import { Avatar } from './Avatar';
import { Composer } from './Composer';
import { BackIcon } from './Icons';
import { MessageBubble } from './MessageBubble';
import shared from './shared.module.css';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  chat: Chat | null;
  onSend: (text: string) => void;
  onRetry: (messageId: string) => void;
  onBack: () => void;
}

export function ChatWindow({ chat, onSend, onRetry, onBack }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const messagesCount = chat?.messages.length ?? 0;
  const chatId = chat?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messagesCount, chatId]);

  if (!chat) {
    return (
      <section className={`${styles.chat} ${styles.placeholder}`}>
        <p>Выберите чат или создайте новый</p>
      </section>
    );
  }

  return (
    <section className={styles.chat} aria-label={`Чат: ${chat.name}`}>
      <header className={styles.header}>
        <button
          type="button"
          className={`${shared.iconButton} ${styles.back}`}
          onClick={onBack}
          aria-label="К списку чатов"
        >
          <BackIcon />
        </button>
        <Avatar name={chat.name} size={40} />
        <div>
          <h2 className={styles.name}>{chat.name}</h2>
          {chat.phone && <p className={styles.phone}>{formatPhone(chat.phone)}</p>}
        </div>
      </header>

      <div className={styles.messages} role="log" aria-live="polite" aria-label="Сообщения">
        {chat.messages.length === 0 && <p className={styles.empty}>Напишите первое сообщение</p>}
        {chat.messages.map((message) => (
          <MessageBubble key={message.id} message={message} onRetry={onRetry} />
        ))}
        <div ref={endRef} />
      </div>

      {/* key сбрасывает черновик при переключении чата */}
      <Composer key={chat.id} onSend={onSend} />
    </section>
  );
}
