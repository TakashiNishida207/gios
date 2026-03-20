// src/intelligence/types.ts
// Intelligence Module の共通インターフェース

export interface IntelligenceModule {
  name: string;
  process(input: Record<string, unknown>): Record<string, unknown>;
}
