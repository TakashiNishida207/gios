"use client"

import { useState } from 'react'
import type { AgendaItem, Phase } from '@pm/types/agenda'
import type { VoiceItem } from '@pm/types/voice'
import { MatrixView } from './MatrixView'
import { DetailPanel } from './DetailPanel'
import { usePreferences } from '@/ui/preferences'

type Props = {
  agendaItems: AgendaItem[]
  voiceItems: VoiceItem[]
  phase: Phase
  currentRoleId?: string
  currentRoleName?: string
}

export function DiscussionCanvas({
  agendaItems,
  voiceItems,
  phase,
  currentRoleId = 'role-default',
  currentRoleName = 'ユーザー',
}: Props) {
  const [focusedItem, setFocusedItem] = useState<AgendaItem | null>(null)
  const { lang } = usePreferences()

  return (
    <div className="relative flex flex-col h-full overflow-hidden" data-testid="discussion-canvas">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0 bg-white">
        <h2 className="text-sm font-semibold text-gray-700">
          {lang === 'ja' ? 'ディスカッションキャンバス' : 'Discussion Canvas'}
        </h2>
        <span className="text-xs text-gray-400">
          {agendaItems.length}{lang === 'ja' ? ' アジェンダ' : ' agenda items'}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <MatrixView
          agendaItems={agendaItems}
          voiceItems={voiceItems}
          phase={phase}
          currentRoleId={currentRoleId}
          currentRoleName={currentRoleName}
          onSelectItem={setFocusedItem}
        />
      </div>

      {focusedItem && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-20"
            onClick={() => setFocusedItem(null)}
          />
          <DetailPanel
            item={focusedItem}
            allVoiceItems={voiceItems}
            phase={phase}
            currentRoleId={currentRoleId}
            currentRoleName={currentRoleName}
            onClose={() => setFocusedItem(null)}
          />
        </>
      )}
    </div>
  )
}
