import React from 'react'
import { AmevaAudioPlayerViewer } from '../media/AmevaAudioBlock'

export function InlineAudioRenderer({ code }: { code: string }) {
  let initialUrl = ''
  let initialCaption = ''

  if (code) {
    try {
      const data = JSON.parse(code.trim())
      if (typeof data === 'string') {
        initialUrl = data
      } else if (data && typeof data === 'object') {
        initialUrl = data.url || ''
        initialCaption = data.caption || ''
      }
    } catch {
      initialUrl = code.trim()
    }
  }

  return (
    <div style={{ margin: '14px 0', width: '100%' }}>
      <AmevaAudioPlayerViewer
        url={initialUrl}
        caption={initialCaption}
        blockId="inline-markdown-audio"
        isEditable={true}
      />
    </div>
  )
}
