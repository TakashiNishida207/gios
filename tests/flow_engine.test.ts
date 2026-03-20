// tests/flow_engine.test.ts
import { FlowEngine } from "../src/intelligence/flow_engine";
import { dictionary } from "../src/dictionary";

const engine = new FlowEngine(dictionary);

describe("FlowEngine", () => {
  describe("classifyByFlow", () => {
    it("Input フェーズの変数を Input バケットに分類する", () => {
      const result = engine.classifyByFlow({ customerName: "ACME", industry: "SaaS" });
      expect(result.Input["customerName"]).toBe("ACME");
      expect(result.Input["industry"]).toBe("SaaS");
    });

    it("Processing フェーズの変数を Processing バケットに分類する", () => {
      const result = engine.classifyByFlow({ gapLevel: 3, priorityScore: 9 });
      expect(result.Processing["gapLevel"]).toBe(3);
      expect(result.Processing["priorityScore"]).toBe(9);
    });

    it("Insight フェーズの変数を Insight バケットに分類する", () => {
      const result = engine.classifyByFlow({ narrative: "story", valueHypothesis: "hypothesis" });
      expect(result.Insight["narrative"]).toBe("story");
      expect(result.Insight["valueHypothesis"]).toBe("hypothesis");
    });

    it("Learning フェーズの変数を Learning バケットに分類する", () => {
      const result = engine.classifyByFlow({ learning: "lesson", bestPractice: "practice" });
      expect(result.Learning["learning"]).toBe("lesson");
      expect(result.Learning["bestPractice"]).toBe("practice");
    });

    it("Data Dictionary にない変数はスキップする", () => {
      const result = engine.classifyByFlow({ unknownVar: "value" });
      const totalVars = Object.values(result).reduce((n, b) => n + Object.keys(b).length, 0);
      expect(totalVars).toBe(0);
    });

    it("複数フェーズの変数を同時に分類する", () => {
      const result = engine.classifyByFlow({
        customerName: "ACME",  // Input
        gapLevel: 3,           // Processing
        narrative: "story",    // Insight
        learning: "lesson",    // Learning
      });
      expect(Object.keys(result.Input)).toContain("customerName");
      expect(Object.keys(result.Processing)).toContain("gapLevel");
      expect(Object.keys(result.Insight)).toContain("narrative");
      expect(Object.keys(result.Learning)).toContain("learning");
    });
  });

  describe("applyCausalFlow", () => {
    it("分類済みバケットをそのまま保持する", () => {
      const buckets = engine.classifyByFlow({ customerName: "ACME", narrative: "story" });
      const causal  = engine.applyCausalFlow(buckets);
      expect(causal.Input["customerName"]).toBe("ACME");
      expect(causal.Insight["narrative"]).toBe("story");
    });

    it("全フェーズのキーが存在する", () => {
      const buckets = engine.classifyByFlow({});
      const causal  = engine.applyCausalFlow(buckets);
      const phases  = ["Input", "Processing", "Insight", "Action", "Feedback", "Learning"];
      phases.forEach((p) => expect(causal).toHaveProperty(p));
    });
  });
});
