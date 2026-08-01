declare module "node:sqlite" {
  export interface DatabaseSyncOptions {
    readOnly?: boolean;
  }

  export type SupportedValueType = null | number | bigint | string | Uint8Array;

  export interface StatementSync {
    get(...params: SupportedValueType[]): Record<string, unknown> | undefined;
    all(...params: SupportedValueType[]): Record<string, unknown>[];
    run(...params: SupportedValueType[]): {
      changes: number;
      lastInsertRowid: number | bigint;
    };
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions);
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    close(): void;
  }
}
