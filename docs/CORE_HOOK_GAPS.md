# CORE HOOK GAPS & PATCH PROPOSAL

The ZERO-TOUCH CORE rule has been strictly followed. All observability was implemented using Wrappers (LLMEngineAdapter wrapped by LlamaHttpObserver) and context interceptors (ConsoleCollector via AsyncLocalStorage).

However, some internal states remain strictly hidden and cannot be fully observed without modifying the core files.

## NOT_OBSERVABLE_WITHOUT_CORE_HOOK

### 1. `ThoughtParser` internal state (AgentOrchestrator.ts)
- **Gap**: `ThoughtParser` handles partial tool JSONs. When it errors out *before* SelfHealing kicks in, the error is caught internally and sometimes silenced or passed directly to `onToolCallParseError`. We cannot intercept the precise stream offsets of failures.
- **Proposed Patch**: Add an `OrchestratorEvent` like `tool_parse_diagnostic`.

### 2. `TaskGraph` internal cycle detection details
- **Gap**: The cycle detection `if (this.taskGraph.hasCycle())` logs to `ipc.llmAddLog` directly. Since `ipc` is a separate module, we cannot easily trap it without monkey-patching IPC.
- **Proposed Patch**: Emit `task_graph_cycle_detected` event via `OrchestratorEventCallback`.

### 3. V2 TaskRuntimeStore State Transitions
- **Gap**: `TaskRuntimeStore` triggers internal updates without a public observer, except through `TaskEventLog`. While we did subscribe to `TaskEventLog`, intermediate React state hooks are unobservable.
- **Proposed Patch**: N/A. The `TaskEventLog` subscription is sufficient for Debug Sidecar needs.

---

```patch
--- packages/core/src/renderer/services/ai/orchestrator/AgentOrchestrator.ts
+++ packages/core/src/renderer/services/ai/orchestrator/AgentOrchestrator.ts
@@ -260,6 +260,11 @@
       onFinalAnswerToken: (token, accumulated) => {
         this.accumulatedAnswer = accumulated
         this.emitEvent({ type: 'answer_token', token, accumulated })
       },
       onToolCallParseError: (malformedJson, parseError) => {
+        this.emitEvent({ type: 'tool_parse_diagnostic', malformedJson, error: parseError.message })
         if (this.selfHealingMiddleware !== null) {
```
*Note: This patch has NOT been applied to the core files. It is proposed here only.*
