export class HistoryLimit<T> {
  private history: T[] = [];

  constructor(private limit: number) {}

  push(item: T) {
    this.history.unshift(item);
    this.history = this.history.slice(0, this.limit);
  }

  get() {
    return this.history.reverse();
  }
}
