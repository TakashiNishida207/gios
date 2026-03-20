// src/sync/adapters/gios_adapter.ts
// GIOS Adapter — GIOSStore との入出力を担う唯一のゲートウェイ
// 因果ループ: Intelligence Mapper の後に位置し、Store の状態を更新する

import type { GIOSStore, FlowState, IntelligenceState } from "../../store/store";
import type { IntelligenceBundle } from "../mappers/intelligence_mapper";
import type { FlowPhase, IntelligenceType } from "../../dictionary/types";

export class GIOSAdapter {
  constructor(private store: GIOSStore) {}

  /**
   * Intelligence Mapper の出力を GIOSStore に書き込む。
   * - flowPhase に従い store.flow の対応バケットに格納する
   * - intelligence に従い store.intelligence の対応バケットに格納する
   * Sync Layer 外から直接 store を変更してはならない。
   */
  async update(bundles: IntelligenceBundle[]): Promise<void> {
    for (const bundle of bundles) {
      for (const [intel, data] of Object.entries(bundle) as [IntelligenceType, Record<string, unknown>][]) {
        if (!data) continue;

        // IntelligenceState に存在するバケットのみ書き込む（AIAgent 等は未実装のためスキップ）
        if (!(intel in this.store.intelligence)) continue;
        const key = intel as keyof typeof this.store.intelligence;
        this.store.intelligence[key] = {
          ...this.store.intelligence[key],
          ...data,
        };

        // 同時に flowPhase バケットへも書き込む（Input フェーズのデータのみ）
        this.store.flow["Input"] = {
          ...this.store.flow["Input"],
          ...data,
        };
      }
    }
  }

  /**
   * GIOS 側で変更された Insight / Action / Learning の差分を返す。
   * SyncEngine が GIOS → Notion 逆同期を行う際に使用する。
   * 差分取得後、__diff__ はクリアされる（冪等性の保証）。
   */
  async fetchDiff(): Promise<Record<string, unknown>[]> {
    const diff = this.store.__diff__ as Record<string, unknown>[];
    this.store.__diff__ = []; // 取得後にクリアし、二重送信を防ぐ
    return diff;
  }

  /**
   * Intelligence Flow の特定フェーズへの書き込み。
   * Intelligence Engine が Processing / Insight 等を更新する際に使用する。
   */
  writeToFlow(phase: FlowPhase, data: Record<string, unknown>): void {
    this.store.flow[phase] = {
      ...this.store.flow[phase],
      ...data,
    };
  }

  /**
   * Insight / Action / Learning フェーズの変更を __diff__ に積む。
   * 逆同期が必要なデータはここを通じて記録される。
   */
  markDirty(data: Record<string, unknown>): void {
    (this.store.__diff__ as Record<string, unknown>[]).push(data);
  }

  /** 現在のフロー状態を読み取る（Intelligence Engine が参照する） */
  readFlow(): FlowState {
    return this.store.flow;
  }

  /** 現在の Intelligence 状態を読み取る */
  readIntelligence(): IntelligenceState {
    return this.store.intelligence;
  }
}
