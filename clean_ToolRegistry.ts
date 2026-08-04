/**
 * @file orchestrator/ToolRegistry.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ai/orchestrator/ToolRegistry.ts
 * @role ?먯씠?꾪듃 ?꾧뎄 ?깅줉 諛??ㅽ뻾 以묒븰 ?덉??ㅽ듃由?(?꾧뎄??
 *
 * [?뚮퉬泥?- CONSUMERS / USAGE CONTEXT]
 * - AgentOrchestrator.ts: ReAct 猷⑦봽 ??Tool Call 媛먯? ??executeTool()???몄텧?섏뿬 ?ㅽ뻾.
 * - useAIAgentMode.ts: ?ㅼ??ㅽ듃?덉씠???몄뀡 ?앹꽦 ???꾧뎄 ?깅줉(registerDefaultTools) ?섑뻾.
 *
 * [梨낆엫 踰붿쐞 - RESPONSIBILITY]
 * - ?먯씠?꾪듃媛 ?ъ슜?????덈뒗 ?꾧뎄(Tool)瑜??대쫫 湲곕컲 Map???깅줉?섍퀬 ?ㅽ뻾?쒕떎.
 * - MCP(Model Context Protocol) ?꾧뎄? WASM C-Kernel ?몄뒪??紐낅졊??紐⑤몢 吏?먰븳??
 * - 湲곗〈 agentTools.ts??AgentEngine ?꾧뎄 ?깅줉 諛⑹떇怨??숈씪???명꽣?섏씠?ㅻ? ?쒓났?쒕떎.
 *
 * [?덈? 源⑤㈃ ???섎뒗 怨꾩빟 - CONTRACT]
 * - MUST: executeTool()? ?덈? ?덉쇅瑜?移⑤У?쒗궎吏 留먭퀬 ToolCallResult.error濡?諛섑솚??寃?
 * - MUST NOT: ToolRegistry ?대??먯꽌 ReAct 猷⑦봽 濡쒖쭅??援ы쁽?섏? 留?寃?
 * - MUST NOT: TypeScript any ?뺤떇???고쉶 ?섎떒?쇰줈 ?⑤?濡??좎뼵?섏? 留?寃?
 */

/*
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - ToolDefinition: ?꾧뎄 紐낆꽭 ?명꽣?섏씠??(name, description, parameters, execute).
 * - ToolCallResult: ?꾧뎄 ?ㅽ뻾 寃곌낵 援ъ“泥?
 */
import type { ToolDefinition, ToolCallResult } from './types'

/*
 * [MCP CLIENT IMPORT]
 * - MCPClientManager: MCP ?쒕쾭???깅줉???몃? ?꾧뎄瑜??먭꺽 ?몄텧?섎뒗 ?대씪?댁뼵??留ㅻ땲?.
 */
import { MCPClientManager } from '../../../utils/mcpClient'

/*
 * [IPC EXECUTE TERMINAL IMPORT]
 * - executeTerminal: Electron IPC瑜??듯빐 ?몄뒪??Windows) ??紐낅졊???ㅽ뻾?섎뒗 ?⑥닔.
 *   window.electronAPI.executeTerminal 梨꾨꼸???ъ슜?섎ŉ stdout/stderr/newCwd瑜?諛섑솚?쒕떎.
 */
import { executeTerminal } from '../../ipc/electronApiAdapter'

// [Item 7] Path traversal 諛⑹뼱 愿???꾪룷??import { PathSanitizer, PathSanitizationError } from './task-runtime/policy/PathSanitizer';

/*
 * [IPC ADAPTER IMPORT]
 * - ipc: llmAddLog 濡쒓렇 湲곕줉 ?꾩슜 ?대뙌??(executeTerminal? 吏곸젒 ?꾪룷??.
 */
import * as ipc from '../../ipc/electronApiAdapter'

/* ============================================================
 * ?댁옣 ?꾧뎄 ?곸닔 (Built-in Tool Constants)
 * ============================================================ */

/**
 * BUILTIN_TOOL_NAMES
 * ToolRegistry媛 湲곕낯 ?쒓났?섎뒗 ?댁옣 ?꾧뎄 紐낆묶 ?곸닔.
 * 留덈쾿 臾몄옄??諛⑹?瑜??꾪빐 ?곸닔濡?愿由ы븳??
 */
const BUILTIN_TOOL_NAMES = {
  RUN_COMMAND: 'run_command',
  READ_FILE: 'read_file',
  WRITE_FILE: 'write_file',
  LIST_DIR: 'list_dir',
  APPLY_PATCH: 'apply_patch'
} as const

/* ============================================================
 * ToolRegistry ?대옒?? * ============================================================ */

/**
 * ToolRegistry
 * ?먯씠?꾪듃媛 ?ъ슜???꾧뎄瑜??깅줉?섍퀬 ?대쫫 湲곕컲?쇰줈 ?ㅽ뻾?섎뒗 以묒븰 ?덉??ㅽ듃由?
 *
 * ?ъ슜 ?덉떆:
 * ```ts
 * const registry = new ToolRegistry()
 * await registry.registerDefaultTools()
 * const result = await registry.executeTool('run_command', { cmd: 'dir' })
 * ```
 */
export class ToolRegistry {
  /*
   * [PRIVATE STATE - Tool Map]
   * - tools: ?꾧뎄 紐낆묶(string) ??ToolDefinition 留ㅽ븨 ??μ냼.
   * - ?덉긽 媛? Map??0~N媛쒖쓽 ToolDefinition???깅줉???곹깭.
   */
  private readonly tools: Map<string, ToolDefinition> = new Map()

  private readonly fileAdapter?: import('./task-runtime/artifact/IFileSystemAdapter').IFileSystemAdapter

  constructor(fileAdapter?: import('./task-runtime/artifact/IFileSystemAdapter').IFileSystemAdapter) {
    this.fileAdapter = fileAdapter;
  }

  /**
   * ?꾧뎄瑜??덉??ㅽ듃由ъ뿉 ?깅줉?쒕떎.
   * ?숈씪??name???대? 議댁옱?섎㈃ ??뼱?뚯슫??Override).
   *
   * @param tool - ?깅줉???꾧뎄 紐낆꽭 媛앹껜
   */
  public register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
    ipc.llmAddLog({ text: `[ToolRegistry] ?꾧뎄 ?깅줉: ${tool.name}`, prefix: 'Orchestrator' })
  }

  /**
   * ?깅줉???꾧뎄瑜??쒓굅?쒕떎.
   *
   * @param name - ?쒓굅???꾧뎄 紐낆묶
   */
  public unregister(name: string): void {
    this.tools.delete(name)
  }

  /**
   * ?깅줉??紐⑤뱺 ?꾧뎄??紐낆꽭 諛곗뿴??諛섑솚?쒕떎.
   * LLM ?쒖뒪???꾨＼?꾪듃 鍮뚮뱶 ???꾧뎄 紐⑸줉??二쇱엯?????ъ슜?쒕떎.
   */
  public getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  /**
   * ?꾧뎄瑜??대쫫?쇰줈 議고쉶?섏뿬 ?ㅽ뻾?쒕떎.
   *
   * @param name - ?ㅽ뻾???꾧뎄 紐낆묶 (ThoughtParser媛 ?뚯떛??name ?꾨뱶)
   * @param args - ?꾧뎄???꾨떖???몄옄 媛앹껜
   * @returns ToolCallResult 媛앹껜 (?깃났/?ㅽ뙣 ?뺣낫 ?ы븿)
   */
  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    context?: { missionId?: string; taskId?: string; attemptId?: string }
  ): Promise<ToolCallResult> {
    const tool = this.tools.get(name)

    /*
     * [GUARD: Tool Not Found]
     * - ?깅줉?섏? ?딆? ?꾧뎄 紐낆묶???꾨떖??寃쎌슦 ?먮윭 寃곌낵瑜?諛섑솚?쒕떎.
     * - ?깅줉 ?꾪솴 ?붾쾭洹몃? ?꾪빐 ?꾩옱 ?깅줉???꾧뎄 紐⑸줉??濡쒓렇???④릿??
     */
    if (!tool) {
      const registeredNames = Array.from(this.tools.keys()).join(', ')
      const errorMsg = `?????녿뒗 ?꾧뎄: '${name}'. ?깅줉???꾧뎄: [${registeredNames}]`
      console.error(`[ToolRegistry] ${errorMsg}`)
      return { success: false, error: errorMsg, toolName: name, toolArgs: args }
    }

    ipc.llmAddLog({ text: `[ToolRegistry] ?꾧뎄 ?ㅽ뻾 ?쒖옉: ${name}`, prefix: 'Orchestrator' })

    try {
      const result = await tool.execute(args, context)
      ipc.llmAddLog({
        text: `[ToolRegistry] ?꾧뎄 ?ㅽ뻾 ?꾨즺: ${name} ??${result.success ? '?깃났' : '?ㅽ뙣'}`,
        prefix: 'Orchestrator'
      })
      return result
    } catch (err: unknown) {
      /*
       * [ERROR HANDLING]
       * - ?꾧뎄 ?ㅽ뻾 以??덉쇅媛 諛쒖깮?섎㈃ 移⑤У?쒗궎吏 ?딄퀬 ToolCallResult.error濡?諛섑솚?쒕떎.
       */
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[ToolRegistry] ?꾧뎄 ?ㅽ뻾 以??덉쇅 諛쒖깮 (${name}):`, msg)
      return {
        success: false,
        error: `${name} ?ㅽ뻾 以??ㅻ쪟: ${msg}`,
        toolName: name,
        toolArgs: args
      }
    }
  }

  /**
   * AMEVA OS 湲곕낯 ?댁옣 ?꾧뎄瑜??깅줉?쒕떎.
   * Electron IPC瑜??듯빐 ?몄뒪??Windows) 紐낅졊???ㅽ뻾?섎뒗 ?꾧뎄?ㅼ쓣 ?ы븿?쒕떎.
   *
   * ?깅줉 ?꾧뎄 紐⑸줉:
   * - run_command: ?몄뒪??OS?먯꽌 ??紐낅졊?대? ?ㅽ뻾?섍퀬 異쒕젰??諛섑솚?쒕떎.
   * - read_file: 吏?뺣맂 ?뚯씪???댁슜???쎌뼱 諛섑솚?쒕떎.
   * - write_file: 吏?뺣맂 寃쎈줈???댁슜???뚯씪濡???ν븳??
   * - list_dir: 吏?뺣맂 ?붾젆?좊━???뚯씪 紐⑸줉??諛섑솚?쒕떎.
   */
  public async registerDefaultTools(): Promise<void> {
    /*
     * [TOOL: run_command]
     * - Windows PowerShell???듯빐 ?몄뒪??紐낅졊???ㅽ뻾?쒕떎.
     * - mcp_proxy.js??host_exec WebSocket IPC瑜??듯빐 ?ㅼ젣 ?ㅽ뻾?쒕떎.
     */
    this.register({
      name: BUILTIN_TOOL_NAMES.RUN_COMMAND,
      description: '?몄뒪??OS(Windows)?먯꽌 PowerShell 紐낅졊?대? ?ㅽ뻾?섍퀬 stdout/stderr瑜?諛섑솚?⑸땲?? ?뚯씪 ?묒뾽, 鍮뚮뱶, ?⑦궎吏 ?ㅼ튂 ?깆뿉 ?ъ슜?섏꽭??',
      parameters: {
        type: 'object',
        properties: {
          cmd: { type: 'string', description: '?ㅽ뻾??PowerShell 紐낅졊??(?? dir, npm install, git status)' },
          cwd: { type: 'string', description: '紐낅졊???ㅽ뻾 ?붾젆?좊━ 寃쎈줈 (?좏깮?ы빆)' }
        },
        required: ['cmd']
      },
      execute: async (args, context) => {
        const cmd = String(args['cmd'] ?? '')
        const cwd = args['cwd'] ? String(args['cwd']) : undefined

        try {
          /*
           * [IPC EXECUTION]
           * - ipc.executeHostCommand: mcp_proxy.js??host_exec 硫붿떆吏瑜??듯빐
           *   ?ㅼ젣 Windows PowerShell ?꾨줈?몄뒪瑜?湲곕룞?섍퀬 寃곌낵瑜??섏떊?쒕떎.
           * - ?몄퐫?? UTF-8 媛뺤젣 ?곸슜 (AMEVA OS AGENTS.md 16踰?洹쒖튃 以??.
           */
          const result = await executeTerminal(cmd, cwd)
          return {
            success: true,
            result: result.stdout || result.stderr || '(異쒕젰 ?놁쓬)',
            toolName: BUILTIN_TOOL_NAMES.RUN_COMMAND,
            toolArgs: args
          }
        } catch (execErr: unknown) {
          const msg = execErr instanceof Error ? execErr.message : String(execErr)
          return {
            success: false,
            error: msg,
            toolName: BUILTIN_TOOL_NAMES.RUN_COMMAND,
            toolArgs: args
          }
        }
      }
    })

    /*
     * [TOOL: read_file]
     * - 吏?뺣맂 ?뚯씪 寃쎈줈???댁슜???쎌뼱 臾몄옄?대줈 諛섑솚?쒕떎.
     */
    this.register({
      name: BUILTIN_TOOL_NAMES.READ_FILE,
      description: '吏?뺣맂 ?뚯씪 寃쎈줈???댁슜???쎌뼱 諛섑솚?⑸땲?? 肄붾뱶 ?뚯씪, ?ㅼ젙 ?뚯씪, 臾몄꽌 ?뚯씪 ?깆쓣 ?쎌쓣 ???ъ슜?섏꽭??',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '?쎌쓣 ?뚯씪???덈? 寃쎈줈 ?먮뒗 ?곷? 寃쎈줈' }
        },
        required: ['path']
      },
      execute: async (args, context: any) => {
        if (context?.retryScope === 'SECTION' || context?.retryScope === 'FUNCTION' || context?.retryScope === 'FIELD') {
          return { success: false, error: 'UNAUTHORIZED_TOOL_USE: Cannot use write_file for partial repair scopes. Use apply_patch instead.', toolName: BUILTIN_TOOL_NAMES.WRITE_FILE, toolArgs: args };
        }
        const rawPath = String(args['path'] ?? '')

        // [Item 7] Path traversal 諛⑹뼱
        let safePath: string;
        try {
          safePath = PathSanitizer.sanitizePath(rawPath, 'read', context?.missionId);
        } catch (sanitizeErr: unknown) {
          const reason = sanitizeErr instanceof PathSanitizationError
            ? sanitizeErr.reason : 'UNKNOWN';
          return {
            success: false,
            error: `Path blocked: ${sanitizeErr instanceof Error ? sanitizeErr.message : String(sanitizeErr)} (reason: ${reason})`,
            toolName: BUILTIN_TOOL_NAMES.READ_FILE,
            toolArgs: args
          };
        }

        if (!this.fileAdapter) {
          return {
            success: false,
            error: `fileAdapter is not initialized. Cannot read file.`,
            toolName: BUILTIN_TOOL_NAMES.READ_FILE,
            toolArgs: args
          };
        }

        try {
          const content = await this.fileAdapter.read(safePath);
          return {
            success: true,
            result: content ?? '(鍮??뚯씪)',
            toolName: BUILTIN_TOOL_NAMES.READ_FILE,
            toolArgs: args
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            toolName: BUILTIN_TOOL_NAMES.READ_FILE,
            toolArgs: args
          }
        }
      }
    })

    /*
     * [TOOL: write_file]
     * - 吏?뺣맂 寃쎈줈???댁슜???뚯씪濡???ν븳??
     */
    this.register({
      name: BUILTIN_TOOL_NAMES.WRITE_FILE,
      description: '吏?뺣맂 寃쎈줈???댁슜???뚯씪濡???ν빀?덈떎. 肄붾뱶 ?앹꽦, ?ㅼ젙 ?뚯씪 ?묒꽦 ?깆뿉 ?ъ슜?섏꽭??',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '??ν븷 ?뚯씪???덈? 寃쎈줈 ?먮뒗 ?곷? 寃쎈줈' },
          content: { type: 'string', description: '?뚯씪????ν븷 ?댁슜' }
        },
        required: ['path', 'content']
      },
      execute: async (args, context: any) => {
        if (context?.retryScope === 'SECTION' || context?.retryScope === 'FUNCTION' || context?.retryScope === 'FIELD') {
          return { success: false, error: 'UNAUTHORIZED_TOOL_USE: Cannot use write_file for partial repair scopes. Use apply_patch instead.', toolName: BUILTIN_TOOL_NAMES.WRITE_FILE, toolArgs: args };
        }
        const rawPath = String(args['path'] ?? '')
        const content = String(args['content'] ?? '')

        // [Item 7] Path traversal 諛⑹뼱 ???곌린 ?묒뾽? ?덉슜??猷⑦듃?먯꽌留?        let safePath: string;
        try {
          safePath = PathSanitizer.sanitizePath(rawPath, 'write', context?.missionId);
        } catch (sanitizeErr: unknown) {
          const reason = sanitizeErr instanceof PathSanitizationError
            ? sanitizeErr.reason : 'UNKNOWN';
          return {
            success: false,
            error: `Write blocked: ${sanitizeErr instanceof Error ? sanitizeErr.message : String(sanitizeErr)} (reason: ${reason})`,
            toolName: BUILTIN_TOOL_NAMES.WRITE_FILE,
            toolArgs: args
          };
        }

        if (!this.fileAdapter) {
          return {
            success: false,
            error: `fileAdapter is not initialized. Cannot write file.`,
            toolName: BUILTIN_TOOL_NAMES.WRITE_FILE,
            toolArgs: args
          };
        }

        try {
          await this.fileAdapter.write(safePath, content);
          
          const stat = await this.fileAdapter.stat(safePath);
          const hash = await this.fileAdapter.hash(safePath);

          return {
            success: true,
            result: `?뚯씪 ????꾨즺: ${safePath}`,
            toolName: BUILTIN_TOOL_NAMES.WRITE_FILE,
            toolArgs: args,
            // [Phase 2.2] Artifact Return Contract
            artifactId: context?.artifactId,
            missionId: context?.missionId,
            taskId: context?.taskId,
            attemptId: context?.attemptId,
            outputId: context?.expectedOutput, // Legacy mapping from context
            expectedPath: rawPath,
            normalizedStagedPath: safePath,
            size: stat.size,
            contentHash: hash ?? undefined,
            revision: 1, // Basic default, managed by IdempotencyStore in actual impl
            idempotencyKey: context?.idempotencyKey
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            toolName: BUILTIN_TOOL_NAMES.WRITE_FILE,
            toolArgs: args
          }
        }
      }
    })

    this.register({
      name: BUILTIN_TOOL_NAMES.APPLY_PATCH,
      description: 'Patch a file',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async (args, context: any) => {
        const rawPath = String(args['targetPath'] ?? args['path'] ?? '');
        const expectedOldHash = args['expectedOldHash'] ? String(args['expectedOldHash']) : undefined;
        const patchContent = String(args['replacement'] ?? args['patch'] ?? '');
        const targetSection = String(args['targetSection'] ?? args['targetSelector'] ?? '');
        const sourceRevision = args['sourceRevision'] ? Number(args['sourceRevision']) : undefined;
        
        const missionId = context?.missionId || args['missionId'];
        const taskId = context?.taskId || args['taskId'];
        const attemptId = context?.attemptId || args['attemptId'];
        const artifactId = context?.artifactId || args['artifactId'];
        const currentRevision = context?.currentRevision;
        const retryScope = context?.retryScope || args['retryScope'] || 'FULL_TASK';
        const allowedRanges = args['allowedRanges'] as string[] | undefined;
        const protectedRanges = args['protectedRanges'] as string[] | undefined;

        if (sourceRevision !== undefined && currentRevision !== undefined && sourceRevision !== currentRevision) {
            return { success: false, error: 'STALE: sourceRevision does not match current artifact revision.', toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH, toolArgs: args };
        }

        const newRevision = (sourceRevision || currentRevision || 0) + 1;
        const stagingPath = `/missions/${missionId}/staging/${taskId}/${attemptId}/${artifactId}_rev${newRevision}.txt`;

        let safeFinalPath: string;
        try {
          safeFinalPath = PathSanitizer.sanitizePath(context?.finalPath || rawPath, 'read', missionId);
        } catch (sanitizeErr: unknown) {
          return {
            success: false,
            error: `Patch blocked: ${sanitizeErr instanceof Error ? sanitizeErr.message : String(sanitizeErr)}`,
            toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH,
            toolArgs: args
          };
        }

        if (!this.fileAdapter) {
          return { success: false, error: 'fileAdapter not initialized.', toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH, toolArgs: args };
        }

        try {
          const currentContent = await this.fileAdapter.read(safeFinalPath);
          if (currentContent === null) throw new Error('File not found for patching.');

          const currentHash = await this.fileAdapter.hash(safeFinalPath);
          if (expectedOldHash && currentHash !== expectedOldHash) {
            throw new Error(`Hash mismatch. Expected: ${expectedOldHash}, Actual: ${currentHash}. Patch rejected.`);
          }
          
          let newContent = currentContent;
          let changedRanges: string[] = [];
          let preservedRanges: string[] = [];

          if (retryScope === 'SECTION') {
            if (!targetSection || !patchContent) throw new Error('Both replacement and targetSection are required for SECTION scope.');
            const parts = currentContent.split(targetSection);
            if (parts.length < 2) throw new Error('AMBIGUOUS_REPAIR_TARGET: targetSection not exactly found in the current file.');
            if (parts.length > 2) throw new Error('AMBIGUOUS_REPAIR_TARGET: targetSection found multiple times.');
            newContent = parts[0] + patchContent + parts[1];
          } else if (retryScope === 'FIELD') {
             try {
                const parsed = JSON.parse(currentContent);
                if (targetSection && patchContent) {
                   const parts = currentContent.split(targetSection);
                   if (parts.length === 2) {
                       newContent = parts[0] + patchContent + parts[1];
                       JSON.parse(newContent); 
                   } else {
                       throw new Error('AMBIGUOUS_REPAIR_TARGET: Target field string not uniquely matched.');
                   }
                } else {
                   throw new Error('Target field string and patch required for FIELD scope.');
                }
             } catch (e: any) {
                if (e.message.includes('AMBIGUOUS_REPAIR_TARGET')) throw e;
                throw new Error(`Invalid JSON format after patch: ${e.message}`);
             }
          } else if (retryScope === 'FUNCTION') {
             if (!targetSection || !patchContent) throw new Error('Both replacement and targetSection are required for FUNCTION scope.');
             const parts = currentContent.split(targetSection);
             if (parts.length !== 2) throw new Error('AMBIGUOUS_REPAIR_TARGET: targetFunction not uniquely found.');
             newContent = parts[0] + patchContent + parts[1];
          } else if (retryScope === 'TEST' || retryScope === 'FILE') {
             if (!patchContent) throw new Error(`Patch content required for ${retryScope} scope.`);
             newContent = patchContent;
          } else if (retryScope === 'TOOL_CALL') {
             newContent = currentContent;
          } else { 
             if (patchContent) newContent = patchContent;
          }

          if (newContent === currentContent && retryScope !== 'TOOL_CALL') {
             return {
                success: false,
                error: 'NO_CHANGE: Patch applied but content is identical to the original.',
                toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH,
                toolArgs: args
             };
          }

          const oldLines = currentContent.split('\n');
          const newLines = newContent.split('\n');
          let firstDiff = 0;
          while (firstDiff < oldLines.length && firstDiff < newLines.length && oldLines[firstDiff] === newLines[firstDiff]) {
            firstDiff++;
          }
          let lastOldDiff = oldLines.length - 1;
          let lastNewDiff = newLines.length - 1;
          while (lastOldDiff >= firstDiff && lastNewDiff >= firstDiff && oldLines[lastOldDiff] === newLines[lastNewDiff]) {
            lastOldDiff--;
            lastNewDiff--;
          }
          
          if (firstDiff <= lastOldDiff || firstDiff <= lastNewDiff) {
            changedRanges.push(`L${firstDiff + 1}-L${lastNewDiff + 1}`);
            if (protectedRanges && protectedRanges.length > 0) {
                if (protectedRanges.some(pr => pr.includes('L'))) throw new Error('Patch rejected: Intersects with protectedRanges.');
            }
          }

          await this.fileAdapter.write(stagingPath, newContent);
          const newStat = await this.fileAdapter.stat(stagingPath);
          const newHash = await this.fileAdapter.hash(stagingPath);

          return {
            success: true,
            result: `?뚯씪 遺遺??섏젙 ?꾨즺: ${stagingPath}`,
            toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH,
            toolArgs: args,
            artifactId,
            missionId,
            taskId,
            attemptId,
            expectedPath: rawPath,
            normalizedStagedPath: stagingPath,
            retryScope,
            changedRanges,
            preservedRanges,
            size: newStat.size,
            previousHash: currentHash,
            newHash: newHash ?? undefined,
            previousRevision: sourceRevision,
            newRevision,
            idempotencyKey: args['idempotencyKey'] || context?.idempotencyKey
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            toolName: BUILTIN_TOOL_NAMES.APPLY_PATCH,
            toolArgs: args
          }
        }
      }
    });

    /*
     * [TOOL: list_dir]
     * - 吏?뺣맂 ?붾젆?좊━???뚯씪 諛??섏쐞 ?붾젆?좊━ 紐⑸줉??諛섑솚?쒕떎.
     */
    this.register({
    });

    /*
     * [TOOL: list_dir]
     * - 吏?뺣맂 ?붾젆?좊━???뚯씪 諛??섏쐞 ?붾젆?좊━ 紐⑸줉??諛섑솚?쒕떎.
     */
    this.register({
      name: BUILTIN_TOOL_NAMES.LIST_DIR,
      description: '吏?뺣맂 ?붾젆?좊━???뚯씪 諛??대뜑 紐⑸줉??諛섑솚?⑸땲?? ?꾩옱 ?묒뾽 ?붾젆?좊━ ?먯깋???ъ슜?섏꽭??',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '紐⑸줉??議고쉶???붾젆?좊━ 寃쎈줈. ?앸왂 ???꾩옱 ?붾젆?좊━.' }
        },
        required: []
      },
      execute: async (args) => {
        const path = args['path'] ? String(args['path']) : '.'
        
        if (!this.fileAdapter) {
          return {
            success: false,
            error: `fileAdapter is not initialized. Cannot list directory.`,
            toolName: BUILTIN_TOOL_NAMES.LIST_DIR,
            toolArgs: args
          };
        }

        try {
          const result = await this.fileAdapter.list(path);
          return {
            success: true,
            result: result || '(?붾젆?좊━媛 鍮꾩뼱?덉뒿?덈떎)',
            toolName: BUILTIN_TOOL_NAMES.LIST_DIR,
            toolArgs: args
          }
        } catch (err: unknown) {
          return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
            toolName: BUILTIN_TOOL_NAMES.LIST_DIR,
            toolArgs: args
          }
        }
      }
    })

    /*
     * [MCP ?꾧뎄 ?숈쟻 二쇱엯]
     * - MCPClientManager???깅줉???몃? MCP ?쒕쾭 ?꾧뎄瑜??숈쟻?쇰줈 媛?몄? ?깅줉?쒕떎.
     */
    try {
      const mcpTools = await MCPClientManager.fetchAllTools()
      for (const tool of mcpTools) {
        this.register({
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema as ToolDefinition['parameters'],
          execute: async (args) => {
            const res = await MCPClientManager.callTool(tool.serverId, tool.name, args)
            return {
              success: res.success,
              result: typeof res.result === 'string' ? res.result : JSON.stringify(res.result),
              error: res.error,
              toolName: tool.name,
              toolArgs: args
            }
          }
        })
      }
      if (mcpTools.length > 0) {
        ipc.llmAddLog({
          text: `[ToolRegistry] MCP ?꾧뎄 ${mcpTools.length}媛??숈쟻 ?깅줉 ?꾨즺.`,
          prefix: 'Orchestrator'
        })
      }
    } catch (mcpErr) {
      console.warn('[ToolRegistry] MCP ?꾧뎄 ?숈쟻 二쇱엯 ?ㅽ뙣 (MCP ?쒕쾭 誘몄뿰寃?媛?μ꽦):', mcpErr)
    }
  }

  /**
   * ?깅줉??紐⑤뱺 ?꾧뎄??紐낆꽭瑜?LLM ?쒖뒪???꾨＼?꾪듃???쎌엯 媛?ν븳 ?띿뒪???뺤떇?쇰줈 吏곷젹?뷀븳??
   *
   * 異쒕젰 ?щ㎎:
   * ```
   * [?꾧뎄 紐⑸줉]
   * - run_command: ?몄뒪??OS?먯꽌 紐낅졊?대? ?ㅽ뻾?⑸땲?? ?몄옄: { cmd: string, cwd?: string }
   * - read_file: ?뚯씪 ?댁슜???쎌뒿?덈떎. ?몄옄: { path: string }
   * ```
   */
  public serializeForPrompt(): string {
    const lines = ['[?ъ슜 媛?ν븳 ?꾧뎄 紐⑸줉]']
    for (const tool of this.tools.values()) {
      const requiredArgs = tool.parameters.required ?? []
      const argDesc = Object.entries(tool.parameters.properties)
        .map(([k, v]) => `${k}${requiredArgs.includes(k) ? '' : '?'}: ${v.type}`)
        .join(', ')
      lines.push(`- ${tool.name}: ${tool.description} | ?몄옄: { ${argDesc} }`)
    }
    return lines.join('\n')
  }
}
