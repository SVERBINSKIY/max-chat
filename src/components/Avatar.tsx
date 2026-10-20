import styles from './Avatar.module.css';

function hueFromString(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

function initials(name: string): string {
  const letters = name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (letters.length === 0) return '#';
  if (letters.length === 1) return (letters[0] ?? '').slice(0, 2).toUpperCase();
  return `${letters[0]?.[0] ?? ''}${letters[1]?.[0] ?? ''}`.toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 48 }: AvatarProps) {
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${hueFromString(name)} 55% 45%)`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
