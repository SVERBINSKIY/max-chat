const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });

export const formatTime = (timestamp: number): string => timeFormat.format(timestamp);

export function formatListTime(timestamp: number): string {
  const isToday = new Date(timestamp).toDateString() === new Date().toDateString();
  return isToday ? formatTime(timestamp) : dateFormat.format(timestamp);
}
