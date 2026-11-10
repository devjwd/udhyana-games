declare module 'wake_on_lan' {
  interface WakeOptions {
    address?: string;
    port?: number;
    count?: number;
    interval?: number;
  }
  export function wake(
    mac: string,
    options?: WakeOptions | ((error: Error | null) => void),
    callback?: (error: Error | null) => void
  ): void;
  export function createMagicPacket(mac: string): Buffer;
}

