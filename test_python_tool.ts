import { ExecutePythonTool } from './packages/core/src/renderer/services/ai/orchestrator/tools/builtins/ExecutePythonTool';

async function testPythonTool() {
  console.log('--- ExecutePythonTool 테스트 시작 ---');
  const tool = new ExecutePythonTool();
  
  const code = `
import sys
print("Hello from Python Sandbox!")
print(f"Python version: {sys.version}")
  `;
  
  console.log('실행할 코드:\\n', code);
  
  const result = await tool.execute({ code });
  
  console.log('--- 실행 결과 ---');
  console.log('Success:', result.success);
  console.log('Result:', result.result);
  if (result.error) {
    console.error('Error:', result.error);
  }
}

testPythonTool().catch(console.error);
