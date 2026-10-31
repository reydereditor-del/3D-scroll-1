// Only the latest request can hand ownership to the scene. Late downloads and
// downloads completing after unmount are released instead of replacing a car.
export class AssetRequestGate<T> {
  private generation = 0;
  private readonly release: (asset: T) => void;
  constructor(release: (asset: T) => void) { this.release = release; }
  cancel() { this.generation++; }
  async load(factory: () => Promise<T>): Promise<T | null> {
    const ticket = ++this.generation;
    try {
      const asset = await factory();
      if (ticket !== this.generation) { this.release(asset); return null; }
      return asset;
    } catch (error) {
      if (ticket !== this.generation) return null;
      throw error;
    }
  }
}
