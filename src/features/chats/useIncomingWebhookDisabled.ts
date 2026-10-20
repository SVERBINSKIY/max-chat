import { useEffect, useState } from 'react';
import type { GreenApiClient } from '../../api/client';

export function useIncomingWebhookDisabled(client: GreenApiClient): boolean {
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .getSettings()
      .then((settings) => {
        if (!cancelled) setDisabled(settings?.incomingWebhook === 'no');
      })
      .catch(() => {
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  return disabled;
}
