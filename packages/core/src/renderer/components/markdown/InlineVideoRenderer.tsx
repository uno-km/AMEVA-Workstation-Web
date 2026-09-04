import React from 'react'
import { AmevaVideoPlayerViewer } from '../media/AmevaVideoBlock'

export function InlineVideoRenderer({ code }: { code: string }) {
  let initialUrl = ''
  let initialCaption = ''
  let initialWidth = '100%'
  let initialHeight = '400'

  if (code) {
    try {
      const data = JSON.parse(code.trim())
      if (typeof data === 'string') {
        initialUrl = data
      } else if (data && typeof data === 'object') {
        initialUrl = data.url || ''
        initialCaption = data.caption || ''
        initialWidth = data.width || '100%'
        initialHeight = data.height ? String(data.height) : '400'
      }
    } catch {
      initialUrl = code.trim()
    }
  }

  return (
    <div style={{ margin: '14px 0', width: '100%' }}>
      <AmevaVideoPlayerViewer
        url={initialUrl}
        caption={initialCaption}
        width={initialWidth}
        height={initialHeight}
        blockId="inline-markdown-video"
        isEditable={true}
      />
    </div>
  )
}
