# CORE_HOOK_GAPS Analysis

## 1. Overview

The initial draft of the CORE_HOOK_GAPS.md file was not properly formatted as markdown, and it needs to be revised to meet the required format.

## 2. Details

### 1. ThoughtParser Error Handling (AgentOrchestrator.ts)
- **Fixes**: The `ThoughtParser` should handle JSON parsing errors by emitting a diagnostic event. This can be done by adding an `onToolCallParseError` callback to the `ThoughtParser` middleware.
- **Details**: The diagnostic event should include the malformed JSON and the error message.

### 2. TaskGraph Cycle Detection (AgentOrchestrator.ts)
- **Fixes**: The `TaskGraph` should emit a diagnostic event when a cycle is detected. This can be done by adding a check for cycles in the `hasCycle` method and emitting an event with the cycle information.

### 3. V2 TaskRuntimeStore Implementation
- **Fixes**: The `TaskRuntimeStore` should log task events to a `TaskEventLog`. This can be done by implementing the `TaskEventLog` and logging task events to it.

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
