// src/ui/screens/PowerMeetingScreen.tsx
// PowerMeeting Screen — 会議の構造・決定・アクションを最大化する
// EN: Power Meeting | JP: パワーミーティング

"use client";

import PowerMeetApp from '@/power-meeting/PowerMeetApp'

export default function PowerMeetingScreen() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <PowerMeetApp />
    </div>
  )
}
