export class GreenApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }

  static fromResponse(status: number, body: string): GreenApiError {
    if (status === 401 || status === 403) {
      return new GreenApiError('Неверные idInstance или apiTokenInstance.', status);
    }
    if (status === 429) {
      return new GreenApiError('Слишком много запросов. Попробуйте чуть позже.', status);
    }
    if (status === 466) {
      return new GreenApiError('Достигнут лимит тарифа Developer (3 чата в месяц).', status);
    }
    if (status === 400 && /webhook url/i.test(body)) {
      return new GreenApiError(
        'В кабинете GREEN-API задан webhookUrl. Очистите его и подождите минуту.',
        status,
      );
    }
    return new GreenApiError(`Ошибка GREEN-API (HTTP ${status}).`, status);
  }
}

export function describeError(error: unknown): string {
  return error instanceof GreenApiError ? error.message : 'Что-то пошло не так.';
}
