// src/renderer/services/ai/orchestrator/task-runtime/__tests__/TaskRuntime.test.ts
import assert from "node:assert";

// src/renderer/services/ai/orchestrator/task-runtime/domain/errors.ts
var InvalidTransitionError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidTransitionError";
  }
};
var StaleStateError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "StaleStateError";
  }
};
var MissingVerificationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "MissingVerificationError";
  }
};
var TaskNotFoundError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TaskNotFoundError";
  }
};

// src/renderer/services/ai/orchestrator/task-runtime/state/TaskStateMachine.ts
var TaskStateMachine = class {
  /**
   * 허용된 상태 전이 매핑 (from -> to[])
   * 명시되지 않은 경로는 불법(Illegal)으로 간주합니다.
   */
  static ALLOWED_TRANSITIONS = {
    PENDING: ["READY", "BLOCKED", "CANCELLED"],
    READY: ["RUNNING", "BLOCKED", "CANCELLED"],
    RUNNING: ["VERIFYING", "RETRY_WAIT", "FAILED", "WAITING_USER", "CANCELLED"],
    VERIFYING: ["COMPLETED", "RETRY_WAIT", "FAILED", "BLOCKED", "WAITING_USER", "CANCELLED"],
    RETRY_WAIT: ["READY", "FAILED", "WAITING_USER", "CANCELLED"],
    BLOCKED: ["PENDING", "READY", "FAILED", "WAITING_USER", "CANCELLED"],
    WAITING_USER: ["READY", "FAILED", "CANCELLED"],
    FAILED: ["READY", "SKIPPED", "CANCELLED"],
    // 최종 상태들
    COMPLETED: [],
    SKIPPED: [],
    CANCELLED: []
  };
  /**
   * 상태 전이의 유효성을 검사합니다.
   */
  static canTransition(from, to) {
    return this.ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }
  /**
   * TransitionCommand를 기반으로 TaskEntity의 다음 상태를 반환합니다.
   * 모든 불변(Invariant) 조건을 검증하고 실패 시 Error를 던집니다. (순수 함수 지향)
   *
   * @param entity 기존의 태스크 엔티티
   * @param targetStatus 이동하고자 하는 목적 상태
   * @param command 전이를 지시하는 커맨드 객체
   * @param partialUpdates 상태 변경 시 함께 업데이트할 부가 데이터 (예: verification, failure 등)
   */
  static transition(entity, targetStatus, command, partialUpdates = {}) {
    const currentState = entity.state.status;
    const currentVersion = entity.state.stateVersion;
    if (currentVersion !== command.expectedStateVersion) {
      throw new StaleStateError(
        `State version mismatch for Task ${entity.definition.id}. Expected ${command.expectedStateVersion}, but got ${currentVersion}.`
      );
    }
    if (currentState !== command.expectedCurrentStatus) {
      throw new InvalidTransitionError(
        `Status mismatch. Expected ${command.expectedCurrentStatus}, but got ${currentState}.`
      );
    }
    if (!this.canTransition(currentState, targetStatus)) {
      throw new InvalidTransitionError(
        `Illegal transition from ${currentState} to ${targetStatus}`
      );
    }
    if (targetStatus === "COMPLETED") {
      const verif = partialUpdates.verification || entity.state.verification;
      if (!verif) {
        throw new MissingVerificationError("Cannot transition to COMPLETED: Verification is missing.");
      }
      if (verif.verdict !== "PASS") {
        throw new InvalidTransitionError("Cannot transition to COMPLETED: Verification verdict must be PASS.");
      }
      if (entity.state.activeAttemptId && entity.state.activeAttemptId !== verif.attemptId) {
        throw new InvalidTransitionError("Verification attemptId does not match current activeAttemptId.");
      }
    }
    if (targetStatus === "FAILED") {
      const failure = partialUpdates.lastFailure || entity.state.lastFailure;
      if (!failure) {
        throw new InvalidTransitionError("Cannot transition to FAILED without a valid lastFailure object.");
      }
    }
    if (targetStatus === "BLOCKED") {
      const reason = partialUpdates.blockReason || entity.state.blockReason;
      if (!reason) {
        throw new InvalidTransitionError("Cannot transition to BLOCKED without a blockReason.");
      }
    }
    const newState = {
      ...entity.state,
      ...partialUpdates,
      status: targetStatus,
      stateVersion: currentVersion + 1
    };
    if (targetStatus === "COMPLETED" || targetStatus === "SKIPPED" || targetStatus === "CANCELLED") {
      if (!newState.completedAt) {
        newState.completedAt = command.timestamp;
      }
    }
    return {
      definition: entity.definition,
      state: newState
    };
  }
};

// src/renderer/services/ai/orchestrator/task-runtime/compatibility/LegacyTaskPlanAdapter.ts
var LegacyTaskPlanAdapter = class {
  /**
   * 레거시 JSON 또는 기존 객체 배열을 받아 신규 TaskEntity 리스트로 변환합니다.
   */
  static importFromLegacy(payloads) {
    const result = {
      importedTasks: [],
      warnings: [],
      rejectedItems: [],
      sourceVersion: "v1_legacy",
      targetVersion: "v2_domain"
    };
    if (!Array.isArray(payloads)) {
      result.warnings.push("Input is not an array. Returning empty tasks.");
      return result;
    }
    const seenIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < payloads.length; i++) {
      const item = payloads[i];
      if (!item || typeof item !== "object") {
        result.rejectedItems.push(item);
        result.warnings.push(`Item at index ${i} is not a valid object.`);
        continue;
      }
      let taskId = item.id || `task_auto_${i}_${Date.now()}`;
      if (seenIds.has(taskId)) {
        result.warnings.push(`Duplicate ID found: ${taskId}. Generating a new one.`);
        taskId = `task_auto_dup_${i}_${Date.now()}`;
      }
      seenIds.add(taskId);
      const title = item.title || `Untitled Task ${i + 1}`;
      const objective = item.objective || item.description || title;
      let initialStatus = "PENDING";
      const rawStatus = (item.status || "pending").toLowerCase();
      switch (rawStatus) {
        case "pending":
          initialStatus = "PENDING";
          break;
        case "in_progress":
          initialStatus = "RUNNING";
          break;
        case "failed":
          initialStatus = "FAILED";
          break;
        case "done":
        case "completed":
          initialStatus = "VERIFYING";
          result.warnings.push(`Legacy 'done' status for Task ${taskId} mapped to 'VERIFYING' pending validation.`);
          break;
        case "skipped":
          initialStatus = "SKIPPED";
          break;
        default:
          result.warnings.push(`Unknown status '${rawStatus}' for Task ${taskId}. Defaulting to PENDING.`);
          initialStatus = "PENDING";
      }
      const dependencies = Array.isArray(item.dependencies) ? item.dependencies : [];
      const entity = {
        definition: {
          id: taskId,
          title,
          objective,
          dependencies
        },
        state: {
          status: initialStatus,
          stateVersion: 1,
          retries: 0,
          createdAt: Date.now()
        }
      };
      result.importedTasks.push(entity);
    }
    return result;
  }
  /**
   * 신규 TaskEntity를 기존 React UI가 구독하는 4가지 상태('pending', 'in_progress', 'done', 'failed') 
   * 리터럴 객체 포맷으로 내보냅니다. (Read-only Projection)
   */
  static projectToLegacyUI(entity) {
    let uiStatus = "pending";
    switch (entity.state.status) {
      case "PENDING":
      case "READY":
      case "BLOCKED":
      case "WAITING_USER":
      case "RETRY_WAIT":
        uiStatus = "pending";
        break;
      case "RUNNING":
      case "VERIFYING":
        uiStatus = "in_progress";
        break;
      case "COMPLETED":
      case "SKIPPED":
      case "CANCELLED":
        uiStatus = "done";
        break;
      case "FAILED":
        uiStatus = "failed";
        break;
    }
    return {
      id: entity.definition.id,
      title: entity.definition.title,
      description: entity.definition.objective,
      status: uiStatus,
      dependencies: entity.definition.dependencies
    };
  }
};

// src/renderer/services/ai/orchestrator/task-runtime/store/TaskRuntimeStore.ts
var TaskRuntimeStore = class {
  tasks = /* @__PURE__ */ new Map();
  eventLog;
  constructor(eventLog) {
    this.eventLog = eventLog;
  }
  /**
   * 새 태스크를 등록합니다. (중복 검사 포함)
   */
  registerTask(entity, missionId) {
    if (this.tasks.has(entity.definition.id)) {
      return;
    }
    this.tasks.set(entity.definition.id, entity);
    this.eventLog.appendEvent({
      eventId: crypto.randomUUID(),
      sessionId: missionId,
      taskId: entity.definition.id,
      type: "TASK_REGISTERED",
      toStatus: entity.state.status,
      reason: "Initial task registration",
      actor: "TaskRuntimeStore",
      timestamp: Date.now(),
      stateVersion: entity.state.stateVersion
    });
  }
  /**
   * 특정 Task ID를 조회합니다.
   */
  getTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new TaskNotFoundError(`Task ${taskId} not found in store.`);
    }
    return task;
  }
  /**
   * 전체 태스크 목록을 배열로 반환합니다.
   */
  getAllTasks() {
    return Array.from(this.tasks.values());
  }
  /**
   * 태스크의 상태를 전이시킵니다. StateMachine을 통과합니다.
   * 
   * @param command 상태 전이 명령어 
   * @param targetStatus 목표 상태
   * @param partialUpdates 부가적인 상태 변경 (검증, 에러, 활성 시도ID 등)
   */
  dispatchTransition(command, targetStatus, partialUpdates) {
    const task = this.getTask(command.taskId);
    const fromStatus = task.state.status;
    try {
      const updatedTask = TaskStateMachine.transition(task, targetStatus, command, partialUpdates);
      this.tasks.set(command.taskId, updatedTask);
      this.eventLog.appendEvent({
        eventId: crypto.randomUUID(),
        sessionId: command.missionId,
        taskId: command.taskId,
        attemptId: command.attemptId,
        type: this.mapTargetStatusToEventType(targetStatus),
        fromStatus,
        toStatus: targetStatus,
        reason: command.reason,
        actor: command.actor,
        timestamp: command.timestamp,
        stateVersion: updatedTask.state.stateVersion,
        metadata: command.metadata
      });
    } catch (error) {
      this.eventLog.appendEvent({
        eventId: crypto.randomUUID(),
        sessionId: command.missionId,
        taskId: command.taskId,
        attemptId: command.attemptId,
        type: "TASK_STATE_TRANSITION_REJECTED",
        fromStatus,
        toStatus: targetStatus,
        reason: `Rejection: ${error.message}`,
        actor: command.actor,
        timestamp: command.timestamp,
        stateVersion: task.state.stateVersion
      });
      throw error;
    }
  }
  /**
   * 목표 상태에 대응되는 이벤트 타입을 반환하는 헬퍼 메서드
   */
  mapTargetStatusToEventType(targetStatus) {
    switch (targetStatus) {
      case "READY":
        return "TASK_READY";
      case "RUNNING":
        return "TASK_STARTED";
      case "VERIFYING":
        return "TASK_VERIFICATION_STARTED";
      case "COMPLETED":
        return "TASK_VERIFICATION_PASSED";
      case "FAILED":
        return "TASK_FAILED";
      case "BLOCKED":
        return "TASK_BLOCKED";
      case "SKIPPED":
        return "TASK_SKIPPED";
      case "CANCELLED":
        return "TASK_CANCELLED";
      case "WAITING_USER":
        return "TASK_WAITING_USER";
      default:
        return "TASK_RESULT_SUBMITTED";
    }
  }
  /**
   * (테스트용) 스토어 초기화
   */
  clear() {
    this.tasks.clear();
    this.eventLog.clear();
  }
};

// src/renderer/services/ai/orchestrator/task-runtime/events/TaskEventLog.ts
var TaskEventLog = class {
  events = [];
  /**
   * 이벤트를 로그에 기록합니다.
   * @param event 생성된 TaskEvent
   */
  appendEvent(event) {
    this.events.push(event);
  }
  /**
   * 특정 Task ID와 관련된 이벤트 히스토리를 반환합니다.
   */
  getEventsForTask(taskId) {
    return this.events.filter((e) => e.taskId === taskId);
  }
  /**
   * 전체 이벤트를 반환합니다.
   */
  getAllEvents() {
    return [...this.events];
  }
  /**
   * (테스트용) 이벤트를 초기화합니다.
   */
  clear() {
    this.events = [];
  }
};

// src/renderer/services/ai/orchestrator/task-runtime/__tests__/TaskRuntime.test.ts
var passCount = 0;
var failCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`\u2705 PASS: ${name}`);
    passCount++;
  } catch (e) {
    console.error(`\u274C FAIL: ${name}`);
    console.error(e);
    failCount++;
  }
}
test("Adapter: \uC815\uC0C1 Plan \uBCC0\uD658 \uBC0F \uB204\uB77D/\uC911\uBCF5 ID \uCC98\uB9AC", () => {
  const payloads = [
    { title: "Task 1", status: "pending" },
    { id: "t2", title: "Task 2", status: "in_progress" },
    { id: "t2", title: "Task 3", status: "done" }
    // 중복 ID
  ];
  const result = LegacyTaskPlanAdapter.importFromLegacy(payloads);
  assert.strictEqual(result.importedTasks.length, 3);
  assert.ok(result.importedTasks[0].definition.id.startsWith("task_auto_"));
  assert.strictEqual(result.importedTasks[1].definition.id, "t2");
  assert.ok(result.importedTasks[2].definition.id.startsWith("task_auto_dup_"));
  assert.strictEqual(result.importedTasks[0].state.status, "PENDING");
  assert.strictEqual(result.importedTasks[1].state.status, "RUNNING");
  assert.strictEqual(result.importedTasks[2].state.status, "VERIFYING");
});
var createDummyEntity = (status = "PENDING") => ({
  definition: { id: "task_1", title: "T1", objective: "Obj1", dependencies: [] },
  state: { status, stateVersion: 1, retries: 0, createdAt: Date.now() }
});
var createCommand = (taskId, expectedCurrentStatus, expectedStateVersion) => ({
  commandId: crypto.randomUUID(),
  missionId: "m1",
  taskId,
  expectedCurrentStatus,
  expectedStateVersion,
  reason: "Test command",
  actor: "tester",
  timestamp: Date.now()
});
test("StateMachine: \uC815\uC0C1 \uC804\uC774 (PENDING -> READY -> RUNNING)", () => {
  let entity = createDummyEntity("PENDING");
  let cmd = createCommand("task_1", "PENDING", 1);
  entity = TaskStateMachine.transition(entity, "READY", cmd);
  assert.strictEqual(entity.state.status, "READY");
  assert.strictEqual(entity.state.stateVersion, 2);
  cmd = createCommand("task_1", "READY", 2);
  entity = TaskStateMachine.transition(entity, "RUNNING", cmd);
  assert.strictEqual(entity.state.status, "RUNNING");
});
test("StateMachine: \uBD88\uBC95 \uC804\uC774 \uBC29\uC5B4 (PENDING -> COMPLETED)", () => {
  const entity = createDummyEntity("PENDING");
  const cmd = createCommand("task_1", "PENDING", 1);
  assert.throws(() => {
    TaskStateMachine.transition(entity, "COMPLETED", cmd);
  }, /Illegal transition/);
});
test("StateMachine: \uB099\uAD00\uC801 \uB77D \uBC29\uC5B4 (\uC624\uB798\uB41C stateVersion \uAC70\uBD80)", () => {
  const entity = createDummyEntity("READY");
  const cmd = createCommand("task_1", "READY", 0);
  assert.throws(() => {
    TaskStateMachine.transition(entity, "RUNNING", cmd);
  }, /State version mismatch/);
});
test("StateMachine: COMPLETED \uC804\uC774 \uC2DC PASS \uAC80\uC99D \uB204\uB77D \uAC70\uBD80", () => {
  const entity = createDummyEntity("VERIFYING");
  const cmd = createCommand("task_1", "VERIFYING", 1);
  assert.throws(() => {
    TaskStateMachine.transition(entity, "COMPLETED", cmd);
  }, /MissingVerificationError/);
  assert.throws(() => {
    TaskStateMachine.transition(entity, "COMPLETED", cmd, {
      verification: {
        verificationId: "v1",
        taskId: "task_1",
        attemptId: "a1",
        verdict: "FAIL",
        passedCriteria: [],
        failedCriteria: ["all"],
        verifierType: "deterministic",
        createdAt: Date.now()
      }
    });
  }, /must be PASS/);
  const entitySuccess = TaskStateMachine.transition(entity, "COMPLETED", cmd, {
    verification: {
      verificationId: "v1",
      taskId: "task_1",
      attemptId: "a1",
      verdict: "PASS",
      passedCriteria: ["all"],
      failedCriteria: [],
      verifierType: "deterministic",
      createdAt: Date.now()
    }
  });
  assert.strictEqual(entitySuccess.state.status, "COMPLETED");
});
test("Store & EventLog: \uC131\uACF5\uC801\uC778 \uC804\uC774 \uC2DC \uC774\uBCA4\uD2B8 \uAE30\uB85D", () => {
  const eventLog = new TaskEventLog();
  const store = new TaskRuntimeStore(eventLog);
  const entity = createDummyEntity("READY");
  store.registerTask(entity, "m1");
  const cmd = createCommand("task_1", "READY", 1);
  store.dispatchTransition(cmd, "RUNNING");
  const events = eventLog.getEventsForTask("task_1");
  assert.strictEqual(events.length, 2);
  assert.strictEqual(events[1].type, "TASK_STARTED");
  assert.strictEqual(events[1].fromStatus, "READY");
  assert.strictEqual(events[1].toStatus, "RUNNING");
  assert.strictEqual(events[1].stateVersion, 2);
});
test("Store & EventLog: \uAC70\uBD80\uB41C \uC804\uC774 \uC2DC Rejection \uC774\uBCA4\uD2B8 \uAE30\uB85D", () => {
  const eventLog = new TaskEventLog();
  const store = new TaskRuntimeStore(eventLog);
  const entity = createDummyEntity("READY");
  store.registerTask(entity, "m1");
  const cmd = createCommand("task_1", "READY", 999);
  try {
    store.dispatchTransition(cmd, "RUNNING");
    assert.fail("Should have thrown an error");
  } catch (e) {
    const events = eventLog.getEventsForTask("task_1");
    assert.strictEqual(events.length, 2);
    assert.strictEqual(events[1].type, "TASK_STATE_TRANSITION_REJECTED");
    assert.ok(events[1].reason.includes("State version mismatch"));
  }
});
console.log(`
=============================`);
console.log(`Tests Run: ${passCount + failCount}`);
console.log(`Tests Passed: ${passCount}`);
console.log(`Tests Failed: ${failCount}`);
console.log(`=============================
`);
if (failCount > 0) {
  process.exit(1);
}
