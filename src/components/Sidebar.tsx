import { useState } from 'react';
import type { ConnectionStatus } from '../features/chats/useNotificationPolling';
import type { Chat } from '../features/chats/types';
import { formatListTime } from '../lib/format';
import { Avatar } from './Avatar';
import { LogoutIcon, PlusIcon } from './Icons';
import { NewChatForm } from './NewChatForm';
import shared from './shared.module.css';
import styles from './Sidebar.module.css';

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: 'Подключение…',
  online: 'На связи',
  offline: 'Нет связи',
};

interface SidebarProps {
  idInstance: string;
  chats: Chat[];
  activeChatId: string | null;
  connection: { status: ConnectionStatus; error: string | null };
  webhookDisabled: boolean;
  onSelect: (id: string) => void;
  onCreate: (phone: string) => Promise<void>;
  onLogout: () => void;
}

export function Sidebar({
  idInstance,
  chats,
  activeChatId,
  connection,
  webhookDisabled,
  onSelect,
  onCreate,
  onLogout,
}: SidebarProps) {
  const [creating, setCreating] = useState(false);

  async function handleCreate(phone: string) {
    await onCreate(phone);
    setCreating(false);
  }

  return (
    <aside className={styles.sidebar} aria-label="Чаты">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Чаты</h2>
          <p className={styles.status} data-status={connection.status}>
            <span className={styles.dot} aria-hidden="true" />
            {STATUS_LABEL[connection.status]} · {idInstance}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={shared.iconButton}
            onClick={() => setCreating((value) => !value)}
            aria-label="Новый чат"
            aria-expanded={creating}
          >
            <PlusIcon />
          </button>
          <button type="button" className={shared.iconButton} onClick={onLogout} aria-label="Выйти">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {creating && <NewChatForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />}

      {connection.status === 'offline' && connection.error && (
        <p className={styles.banner} role="alert">
          {connection.error}
        </p>
      )}
      {webhookDisabled && (
        <p className={styles.banner} role="status">
          В настройках инстанса выключено «Получать уведомления о входящих сообщениях». Включите его
          в кабинете GREEN-API, иначе ответы приходить не будут.
        </p>
      )}

      {chats.length === 0 ? (
        <p className={styles.empty}>Чатов пока нет. Нажмите «+» и введите номер получателя.</p>
      ) : (
        <ul className={styles.list}>
          {chats.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            return (
              <li key={chat.id}>
                <button
                  type="button"
                  className={styles.item}
                  aria-current={chat.id === activeChatId ? 'true' : undefined}
                  onClick={() => onSelect(chat.id)}
                >
                  <Avatar name={chat.name} />
                  <span className={styles.itemBody}>
                    <span className={styles.itemLine}>
                      <span className={styles.itemName}>{chat.name}</span>
                      {last && (
                        <time className={styles.itemTime}>{formatListTime(last.timestamp)}</time>
                      )}
                    </span>
                    <span className={styles.itemLine}>
                      <span className={styles.itemPreview}>
                        {last
                          ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}`
                          : 'Нет сообщений'}
                      </span>
                      {chat.unread > 0 && (
                        <span className={styles.badge} aria-label={`Непрочитанных: ${chat.unread}`}>
                          {chat.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
