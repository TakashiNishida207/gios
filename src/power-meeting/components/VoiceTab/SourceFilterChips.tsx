"use client"

import { useState } from 'react'
import type { VoiceSource } from '../../types/voice'
import { voiceSourcePresets, type VoiceSourcePreset } from '../../config/voiceSourcePresets'

type Props = {
  sources: VoiceSource[]
  selectedSources: VoiceSource[]
  filterMode: 'OR' | 'AND'
  countBySource: (source: VoiceSource) => number
  onToggle: (source: VoiceSource) => void
  onModeChange: (mode: 'OR' | 'AND') => void
}

const MAIN_SOURCES: { source: VoiceSource; label: string }[] = [
  { source: 'zendesk',    label: 'Zendesk' },
  { source: 'intercom',   label: 'Intercom·Fin' },
  { source: 'jira',       label: 'Jira' },
  { source: 'asana',      label: 'Asana' },          // D-1
  { source: 'salesforce', label: 'Salesforce' },
  { source: 'hubspot',    label: 'HubSpot' },
  { source: 'notion',     label: 'Notion' },
  { source: 'slack',      label: 'Slack' },
  { source: 'gong',       label: 'Gong' },
  { source: 'email',      label: 'Email' },
]

const MOCK_SOURCES: VoiceSource[] = ['salesforce', 'hubspot']

function SubChips({ onSelect }: { onSelect: (id: string) => void }) {
  const byCategory: Record<string, VoiceSourcePreset[]> = {}
  for (const p of voiceSourcePresets) {
    byCategory[p.category] = [...(byCategory[p.category] ?? []), p]
  }
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 pl-2 border-l-2 border-gray-200">
      {voiceSourcePresets.map(preset => (
        <button
          key={preset.id}
          onClick={() => onSelect(preset.id)}
          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          {preset.label}
        </button>
      ))}
      <button
        onClick={() => onSelect('custom')}
        className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-dashed border-gray-300 hover:bg-gray-100"
      >
        Custom
      </button>
    </div>
  )
}

export function SourceFilterChips({ sources, selectedSources, filterMode, countBySource, onToggle, onModeChange }: Props) {
  const [showOtherSubs, setShowOtherSubs] = useState(false)
  const allSelected = selectedSources.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          data-testid="chip-all"
          onClick={() => {
            if (!allSelected) {
              // reset
              selectedSources.forEach(s => onToggle(s))
            }
          }}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            allSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
          <span className="ml-1 text-xs opacity-70">{sources.reduce((n, s) => n + countBySource(s), 0)}</span>
        </button>

        {MAIN_SOURCES.filter(({ source }) => sources.includes(source) || countBySource(source) > 0).map(({ source, label }) => {
          const count = countBySource(source)
          const active = selectedSources.includes(source)
          const isMock = MOCK_SOURCES.includes(source)
          return (
            <button
              key={source}
              data-testid={`chip-${source}`}
              onClick={() => onToggle(source)}
              className={`text-sm px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs ml-0.5 px-1 rounded-full ${active ? 'bg-white/20' : 'bg-gray-300/60'}`}>
                  {count}
                </span>
              )}
              {isMock && <span className="text-xs opacity-50 italic ml-0.5">mock</span>}
            </button>
          )
        })}

        <button
          data-testid="chip-other"
          onClick={() => setShowOtherSubs(v => !v)}
          className={`text-sm px-3 py-1 rounded-full font-medium transition-colors ${
            showOtherSubs ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Other ▾
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-400">絞り込み:</span>
          {(['OR', 'AND'] as const).map(mode => (
            <button
              key={mode}
              data-testid={`mode-${mode}`}
              onClick={() => onModeChange(mode)}
              className={`text-xs px-2 py-0.5 rounded ${filterMode === mode ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {showOtherSubs && (
        <SubChips onSelect={(id) => {
          console.log('Other sub-source selected:', id)
        }} />
      )}
    </div>
  )
}
