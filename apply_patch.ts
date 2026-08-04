    this.register({
      name: BUILTIN_TOOL_NAMES.APPLY_PATCH,
      description: 'Patch a file',
      parameters: { type: 'object', properties: {}, required: [] },
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
             } catch (e: unknown) {
                if (e instanceof Error && e.message.includes('AMBIGUOUS_REPAIR_TARGET')) throw e;
                throw new Error(`Invalid JSON format after patch: ${e instanceof Error ? e.message : String(e)}`);
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
            result: `파일 부분 수정 완료: ${stagingPath}`,
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
     * - 지정된 디렉토리의 파일 및 하위 디렉토리 목록을 반환한다.
     */
    this.register({
    });
