// src/store/serverStore.ts
// サーバーサイドシングルトンストア — API ルートが参照する唯一の状態
// Next.js のホットリロード対策として global に保持する

import { createInitialStore, type GDIOSStore } from "./store";

declare global {
  // eslint-disable-next-line no-var
  var __gdiosStore: GDIOSStore | undefined;
}

export function getServerStore(): GDIOSStore {
  if (!global.__gdiosStore) {
    global.__gdiosStore = createInitialStore();
  }
  return global.__gdiosStore;
}
