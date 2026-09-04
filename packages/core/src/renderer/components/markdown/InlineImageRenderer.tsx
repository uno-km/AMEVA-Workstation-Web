import React from 'react'
import { AmevaImageGalleryViewer } from '../media/AmevaImageBlock'

export function InlineImageRenderer({ code }: { code: string }) {
  let initialUrl = ''
  let initialCaption = ''
  let initialWidth = '380'
  let initialViewMode = 'grid'
  let initialCardSizes = '{}'

  if (code) {
    try {
      const data = JSON.parse(code.trim())
      if (typeof data === 'string') {
        initialUrl = data
      } else if (Array.isArray(data)) {
        initialUrl = JSON.stringify(data)
      } else if (data && typeof data === 'object') {
        initialUrl = data.url || ''
        initialCaption = data.caption || ''
        initialWidth = data.previewWidth ? String(data.previewWidth) : '380'
        initialViewMode = data.viewMode || 'grid'
        initialCardSizes = typeof data.cardSizes === 'string' ? data.cardSizes : JSON.stringify(data.cardSizes || {})
      }
    } catch {
      initialUrl = code.trim()
    }
  }

  return (
    <div style={{ margin: '14px 0', width: '100%' }}>
      <AmevaImageGalleryViewer
        url={initialUrl}
        caption={initialCaption}
        previewWidth={initialWidth}
        viewMode={initialViewMode}
        cardSizes={initialCardSizes}
        blockId="inline-markdown-image"
        isEditable={true}
      />
    </div>
  )
}
