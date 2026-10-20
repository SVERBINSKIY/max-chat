import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon } from './Icons';
import styles from './Composer.module.css';

const MAX_LENGTH = 4000;

interface ComposerProps {
  onSend: (text: string) => void;
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text);
    setText('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <textarea
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение"
        aria-label="Сообщение"
        maxLength={MAX_LENGTH}
        rows={1}
        autoFocus
      />
      <button type="submit" className={styles.send} disabled={!canSend} aria-label="Отправить">
        <SendIcon />
      </button>
    </form>
  );
}
