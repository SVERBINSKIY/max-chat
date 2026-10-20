import { describe, expect, it } from 'vitest';
import { formatPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('убирает всё, кроме цифр', () => {
    expect(normalizePhone('+375 (33) 641-48-49')).toBe('375336414849');
  });

  it('заменяет российскую 8 на 7', () => {
    expect(normalizePhone('8 999 123-45-67')).toBe('79991234567');
  });

  it('отклоняет слишком короткие и длинные номера', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('1'.repeat(16))).toBeNull();
  });
});

describe('formatPhone', () => {
  it('форматирует российские номера', () => {
    expect(formatPhone('79991234567')).toBe('+7 (999) 123-45-67');
  });

  it('остальные показывает как +цифры', () => {
    expect(formatPhone('375336414849')).toBe('+375336414849');
  });
});
