import { useId, useState, type FormEvent } from 'react';
import { normalizePhone } from '../lib/phone';
import shared from './shared.module.css';
import styles from './NewChatForm.module.css';

interface NewChatFormProps {
  onSubmit: (phone: string) => Promise<void>;
  onCancel: () => void;
}

export function NewChatForm({ onSubmit, onCancel }: NewChatFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const phone = normalizePhone(value);
    if (!phone) {
      setError('Введите номер в международном формате, например +7 999 123-45-67.');
      return;
    }

    setPending(true);
    await onSubmit(phone);
    setPending(false);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Номер телефона получателя</label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="tel"
        placeholder="+7 999 123-45-67"
        autoFocus
      />
      {error && (
        <p className={shared.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button type="button" className={shared.ghostButton} onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className={shared.primaryButton} disabled={pending}>
          {pending ? 'Ищем…' : 'Создать чат'}
        </button>
      </div>
    </form>
  );
}
