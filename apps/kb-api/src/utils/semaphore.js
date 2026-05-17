// Простой Semaphore через Promise. Без npm-зависимостей.
//
// Использование:
//   const sem = new Semaphore(1);
//   const release = await sem.acquire();
//   try { ...работа... } finally { release(); }
//
// setMax(n) меняет лимит на лету. Если уменьшаем — текущие работники
// доработают, новые ждут в очереди. Если увеличиваем — освобождаем
// сразу до max ожидающих.
export class Semaphore {
  constructor(max) {
    this.max = Math.max(1, Math.trunc(Number(max) || 1));
    this.current = 0;
    this.waiters = [];
  }

  setMax(n) {
    this.max = Math.max(1, Math.trunc(Number(n) || 1));
    this._drainWaiters();
  }

  size() {
    return { max: this.max, current: this.current, waiting: this.waiters.length };
  }

  async acquire() {
    if (this.current < this.max) {
      this.current += 1;
      return () => this._release();
    }
    return new Promise((resolve) => {
      this.waiters.push(() => {
        this.current += 1;
        resolve(() => this._release());
      });
    });
  }

  _release() {
    this.current = Math.max(0, this.current - 1);
    this._drainWaiters();
  }

  _drainWaiters() {
    while (this.current < this.max && this.waiters.length > 0) {
      const next = this.waiters.shift();
      next();
    }
  }
}
