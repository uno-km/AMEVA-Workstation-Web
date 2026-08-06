import { create } from 'zustand';
import { extractPdfText } from '../document-intelligence/extractors/pdfTextExtractor';
import { profileDocument } from '../document-intelligence/documentProfiler';
import type { DocumentProfileResult } from '../document-intelligence/types';

interface QueueItem {
  id: string; // fileId
  file: File;
}

interface DocumentProfilerState {
  profiles: Record<string, DocumentProfileResult>; // fileId -> profile
  queue: QueueItem[];
  isProcessing: boolean;
  enqueue: (fileId: string, file: File) => void;
  processQueue: () => Promise<void>;
}

export const useDocumentProfilerStore = create<DocumentProfilerState>((set, get) => ({
  profiles: {},
  queue: [],
  isProcessing: false,
  enqueue: (fileId, file) => {
    // Only process PDF for now, and don't re-process if already processed or in queue
    if (!file.name.toLowerCase().endsWith('.pdf')) return;
    
    set((state) => {
      if (state.profiles[fileId] || state.queue.some(q => q.id === fileId)) {
        return state;
      }
      return { queue: [...state.queue, { id: fileId, file }] };
    });
    
    get().processQueue();
  },
  processQueue: async () => {
    const state = get();
    if (state.isProcessing || state.queue.length === 0) return;

    set({ isProcessing: true });

    while (get().queue.length > 0) {
      const item = get().queue[0];
      try {
        console.log(`[Document DNA] Starting analysis for ${item.file.name}`);
        const pagesText = await extractPdfText(item.file);
        
        const profile = await profileDocument(
          { fileName: item.file.name, docType: 'pdf', fileSize: item.file.size },
          pagesText
        );
        
        console.log(`[Document DNA] Completed analysis for ${item.file.name}`, profile);
        
        set((s) => ({
          profiles: { ...s.profiles, [item.id]: profile },
        }));
      } catch (err) {
        console.error(`[Document DNA] Error analyzing ${item.file.name}:`, err);
      } finally {
        set((s) => ({
          queue: s.queue.slice(1) // Dequeue
        }));
      }
      
      // Let the UI breathe between documents
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    set({ isProcessing: false });
  }
}));
