import { err, ok, type Result } from "./result";

export interface Entity {
  readonly id: number;
}

export class InMemoryRepository<T extends Entity> {
  private items: T[] = [];
  private nextId = 1;

  constructor(initial: readonly T[] = []) {
    for (const item of initial) {
      this.items.push({ ...item });
      if (item.id >= this.nextId) {
        this.nextId = item.id + 1;
      }
    }
  }

  get count(): number {
    return this.items.length;
  }

  create(data: Omit<T, "id">): T {
    const id = this.nextId;
    this.nextId += 1;
    // Конструювання нової сутності T із валідного Omit<T, "id"> та згенерованого числового id
    const entity = { ...data, id } as T;
    this.items.push(entity);
    return { ...entity };
  }

  findById(id: number): T | undefined {
    const found = this.items.find((item) => item.id === id);
    return found ? { ...found } : undefined;
  }

  findAll(filter: Partial<T> = {}): T[] {
    return this.items
      .filter((item) => this.matchesFilter(item, filter))
      .map((item) => ({ ...item }));
  }

  update(id: number, patch: Partial<Omit<T, "id">>): Result<T> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return err(`Сутність з id=${id} не знайдено`);
    }
    const existing = this.items[index];
    if (!existing) {
      return err(`Сутність з id=${id} не знайдено`);
    }
    const updated: T = {
      ...existing,
      ...patch,
      id: existing.id,
    };
    this.items[index] = updated;
    return ok({ ...updated });
  }

  remove(id: number): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      return false;
    }
    this.items.splice(index, 1);
    return true;
  }

  private matchesFilter(item: T, filter: Partial<T>): boolean {
    for (const key in filter) {
      if (Object.prototype.hasOwnProperty.call(filter, key)) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
    }
    return true;
  }
}
