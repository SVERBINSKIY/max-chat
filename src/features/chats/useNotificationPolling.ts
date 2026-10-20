import { useEffect, useRef, useState } from 'react';
import type { GreenApiClient } from '../../api/client';
import { describeError } from '../../api/errors';
import { parseIncomingMessage } from '../../api/notifications';
import type { IncomingMessage } from '../../api/types';
import { delay } from '../../lib/async';

export type ConnectionStatus = 'connecting' | 'online' | 'offline';

const MIN_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

export function useNotificationPolling(
  client: GreenApiClient,
  onMessage: (message: IncomingMessage) => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function poll() {
      let failures = 0;

      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(signal);
          failures = 0;
          setStatus('online');
          setError(null);
          if (!notification) continue;

          const message = parseIncomingMessage(notification.body);
          if (message) onMessageRef.current(message);

          await client.deleteNotification(notification.receiptId);
        } catch (e) {
          if (signal.aborted) return;
          failures += 1;
          setStatus('offline');
          setError(describeError(e));
          await delay(Math.min(MIN_RETRY_MS * 2 ** (failures - 1), MAX_RETRY_MS), signal);
        }
      }
    }

    void poll();
    return () => controller.abort();
  }, [client]);

  return { status, error };
}
