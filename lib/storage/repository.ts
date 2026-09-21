export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>
  get(id: string): Promise<T | null>
  create(input: Omit<T, 'id'>): Promise<T>
  update(id: string, input: Partial<Omit<T, 'id'>>): Promise<T>
  remove(id: string): Promise<void>
}
