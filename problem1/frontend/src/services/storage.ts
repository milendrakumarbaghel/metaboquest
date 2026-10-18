export const storage = {
  get<T>(key: string): T | undefined { try { const value = sessionStorage.getItem(`mq:${key}`); return value ? JSON.parse(value) as T : undefined } catch { return undefined } },
  set(key: string, value: unknown): boolean { try { sessionStorage.setItem(`mq:${key}`, JSON.stringify(value)); return true } catch { return false } },
  remove(key: string) { try { sessionStorage.removeItem(`mq:${key}`) } catch { /* Storage may be unavailable. */ } },
}
export const tokenKey = (id: string) => `result-token:${id}`
