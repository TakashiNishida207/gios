// src/store/updateDiff.ts
// Diff 更新関数 — GDIOS → Notion 逆同期キューを管理する
// 因果ループ: Insight/Action/Learning の変更 → ここ → GDIOSAdapter.fetchDiff() → Notion

import type { GDIOSStore } from "./store";

/**
 * 逆同期が必要なレコードを __diff__ キューに追加する。
 * Insight / Action / Learning フェーズの変更が発生した場合に呼ぶ。
 * `__notionPageId__` を含めることで Notion への書き戻し先を追跡可能にする。
 */
export function appendDiff(
  state: GDIOSStore,
  record: Record<string, unknown>
): Pick<GDIOSStore, "__diff__"> {
  return {
    __diff__: [...(state.__diff__ as Record<string, unknown>[]), record],
  };
}

/**
 * 逆同期完了後に __diff__ をクリアする。
 * GDIOSAdapter.fetchDiff() が呼ばれた後に Zustand set() へ渡す。
 * 二重送信を防ぐため、必ず fetchDiff() とペアで使用する。
 */
export function clearDiff(
  _state: GDIOSStore
): Pick<GDIOSStore, "__diff__"> {
  return { __diff__: [] };
}

/**
 * __diff__ の現在のスナップショットを返す（読み取り専用参照）。
 * fetchDiff() が呼ぶ前に内容を確認したい場合に使用する。
 */
export function peekDiff(state: GDIOSStore): Record<string, unknown>[] {
  return state.__diff__ as Record<string, unknown>[];
}
