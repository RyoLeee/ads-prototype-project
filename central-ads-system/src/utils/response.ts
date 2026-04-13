export function ok<T>(data: T, message = "success") {
  return { success: true, message, data };
}

export function fail(message: string, code = 400) {
  return { success: false, message, code };
}

export function paginated<T>(items: T[], total: number, page: number, limit: number) {
  return {
    success: true,
    data: items,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
