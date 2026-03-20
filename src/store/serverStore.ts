// src/store/serverStore.ts
// サーバーサイドシングルトンストア — API ルートが参照する唯一の状態
// Next.js のホットリロード対策として global に保持する

import { createInitialStore, type GIOSStore } from "./store";

declare global {
  // eslint-disable-next-line no-var
  var __giosStore: GIOSStore | undefined;
}

export function getServerStore(): GIOSStore {
  if (!global.__giosStore) {
    global.__giosStore = createInitialStore();
  }
  return global.__giosStore;
}
