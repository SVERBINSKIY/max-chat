import { useMemo } from 'react';
import { createGreenApiClient } from '../api/client';
import type { Credentials } from '../api/types';
import { useIncomingWebhookDisabled } from '../features/chats/useIncomingWebhookDisabled';
import { useMessenger } from '../features/chats/useMessenger';
import { ChatWindow } from './ChatWindow';
import { Sidebar } from './Sidebar';
import styles from './Messenger.module.css';

interface MessengerProps {
  credentials: Credentials;
  onLogout: () => void;
}

export function Messenger({ credentials, onLogout }: MessengerProps) {
  const client = useMemo(() => createGreenApiClient(credentials), [credentials]);
  const { chats, activeChat, connection, selectChat, createChat, sendMessage, retryMessage } =
    useMessenger(client, credentials.idInstance);
  const webhookDisabled = useIncomingWebhookDisabled(client);

  return (
    <div className={styles.layout} data-chat-open={activeChat !== null}>
      <Sidebar
        idInstance={credentials.idInstance}
        chats={chats}
        activeChatId={activeChat?.id ?? null}
        connection={connection}
        webhookDisabled={webhookDisabled}
        onSelect={selectChat}
        onCreate={createChat}
        onLogout={onLogout}
      />
      <ChatWindow
        chat={activeChat}
        onSend={sendMessage}
        onRetry={retryMessage}
        onBack={() => selectChat(null)}
      />
    </div>
  );
}
