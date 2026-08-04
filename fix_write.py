import sys
import os

target_file = os.path.abspath(os.path.join(os.path.dirname(__file__), 'packages/core/src/renderer/services/ai/orchestrator/ToolRegistry.ts'))

try:
    with open(target_file, 'r', encoding='utf-8') as f:
        tr = f.read()
except Exception as e:
    print(f"Error reading file: {e}")
    sys.exit(1)

target = "      execute: async (args, context) => {\n        const rawPath = String(args['path'] ?? '')"
replacement = """      execute: async (args, context: any) => {
        if (context?.retryScope === 'SECTION' || context?.retryScope === 'FUNCTION' || context?.retryScope === 'FIELD') {
          return { success: false, error: 'UNAUTHORIZED_TOOL_USE: Cannot use write_file for partial repair scopes. Use apply_patch instead.', toolName: BUILTIN_TOOL_NAMES.WRITE_FILE, toolArgs: args };
        }
        const rawPath = String(args['path'] ?? '')"""

try:
    if target in tr:
        tr = tr.replace(target, replacement)
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(tr)
        print("Success")
    else:
        target2 = "      execute: async (args, context) => {\r\n        const rawPath = String(args['path'] ?? '')"
        if target2 in tr:
            tr = tr.replace(target2, replacement.replace('\n', '\r\n'))
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(tr)
            print("Success (CRLF)")
        else:
            print("Not found")
except Exception as e:
    print(f"Error writing file: {e}")
    sys.exit(1)
