// src/power-meeting/stores/executionStore.ts
// 人的実行・AI実行タスクのストア
// GDIOS連携モード時はマッパーが生成したタスクで上書きされる

import { create } from 'zustand'

export type HumanTaskStatus = 'pending' | 'in_progress' | 'done'
export type HumanTaskPriority = 'high' | 'medium' | 'low'
export type HumanTaskCategory = 'customer' | 'technical' | 'internal'

export interface HumanTask {
  id: string
  title: string
  description: string
  assignee: string
  role: string
  dueDate: string
  status: HumanTaskStatus
  priority: HumanTaskPriority
  category: HumanTaskCategory
}

export type AITaskStatus = 'ready' | 'running' | 'done' | 'error'

export interface AITask {
  id: string
  title: string
  description: string
  channel: string
  channelIcon: string
  estimatedSeconds: number
  status: AITaskStatus
  result?: string
}

interface ExecutionStore {
  humanTasks: HumanTask[]
  aiTasks:    AITask[]
  setHumanTasks: (tasks: HumanTask[]) => void
  setAITasks:    (tasks: AITask[])    => void
  updateHumanTaskStatus: (id: string, status: HumanTaskStatus) => void
  updateAITaskStatus:    (id: string, status: AITaskStatus, result?: string) => void
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  humanTasks: [],
  aiTasks:    [],

  setHumanTasks: (tasks) => set({ humanTasks: tasks }),
  setAITasks:    (tasks) => set({ aiTasks:    tasks }),

  updateHumanTaskStatus: (id, status) =>
    set((s) => ({
      humanTasks: s.humanTasks.map((t) => t.id === id ? { ...t, status } : t),
    })),

  updateAITaskStatus: (id, status, result) =>
    set((s) => ({
      aiTasks: s.aiTasks.map((t) =>
        t.id === id ? { ...t, status, ...(result ? { result } : {}) } : t
      ),
    })),
}))
