export class HistoryLimit<T> {
  private history: T[] = [];

  constructor(private limit: number) {}

  push(item: T) {
    this.history.unshift(item);

    if (this.history.length > this.limit) {
      this.history.pop();
    }
  }

  get() {
    return this.history.reverse();
  }
}
