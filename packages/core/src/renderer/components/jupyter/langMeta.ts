/**
 * ============================================================================
 * @file langMeta.ts
 * @description 지원 언어 메타데이터, 도메인별 카테고리 및 언어별 표준 스타터 템플릿(Default Code Template)을 정의합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

export interface LangMeta {
  color: string
  label: string
  runnable: boolean   // Run 버튼 활성화 여부
  previewable: boolean // Preview 버튼 활성화 여부
  isHtml: boolean
  isMermaid: boolean
}

export interface LanguageItem {
  id: string
  name: string
  color: string
  runnable?: boolean
  previewable?: boolean
  badge?: string
}

export interface LanguageCategory {
  id: string
  name: string
  icon?: string
  description?: string
  languages: LanguageItem[]
}

export const LANG_META: Record<string, LangMeta> = {
  javascript: { color: '#f59e0b', label: 'JavaScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  js:         { color: '#f59e0b', label: 'JavaScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  typescript: { color: '#60a5fa', label: 'TypeScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  ts:         { color: '#60a5fa', label: 'TypeScript', runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  python:     { color: '#3b82f6', label: 'Python',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  py:         { color: '#3b82f6', label: 'Python',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  java:       { color: '#f43f5e', label: 'Java',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  sql:        { color: '#e879f9', label: 'SQL',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  bash:       { color: '#ec4899', label: 'Bash',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  sh:         { color: '#ec4899', label: 'Shell',      runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  lua:        { color: '#38bdf8', label: 'Lua',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  solidity:   { color: '#aa6746', label: 'Solidity',   runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  sol:        { color: '#aa6746', label: 'Solidity',   runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  c:          { color: '#10b981', label: 'C',          runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  cpp:        { color: '#10b981', label: 'C++',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  go:         { color: '#00add8', label: 'Go',         runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  rust:       { color: '#dea584', label: 'Rust',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  rs:         { color: '#dea584', label: 'Rust',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  html:       { color: '#f97316', label: 'HTML',       runnable: true,  previewable: true,  isHtml: true,  isMermaid: false },
  mermaid:    { color: '#2563eb', label: 'Mermaid',    runnable: false, previewable: true,  isHtml: false, isMermaid: true  },
  markdown:   { color: '#34d399', label: 'Markdown',   runnable: false, previewable: true,  isHtml: false, isMermaid: false },
  css:        { color: '#38bdf8', label: 'CSS',        runnable: false, previewable: false, isHtml: false, isMermaid: false },
  json:       { color: '#34d399', label: 'JSON',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
  xml:        { color: '#fb923c', label: 'XML',        runnable: false, previewable: false, isHtml: false, isMermaid: false },
  csharp:     { color: '#239120', label: 'C#',         runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  cs:         { color: '#239120', label: 'C#',         runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  php:        { color: '#777bb4', label: 'PHP',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  ruby:       { color: '#cc342d', label: 'Ruby',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  rb:         { color: '#cc342d', label: 'Ruby',       runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  r:          { color: '#276dc3', label: 'R',          runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  kotlin:     { color: '#7f52ff', label: 'Kotlin',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  kt:         { color: '#7f52ff', label: 'Kotlin',     runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  swift:      { color: '#f05138', label: 'Swift',      runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  zig:        { color: '#f7a41d', label: 'Zig',        runnable: true,  previewable: false, isHtml: false, isMermaid: false },
  text:       { color: '#6b7280', label: 'Text',       runnable: false, previewable: false, isHtml: false, isMermaid: false },
  plaintext:  { color: '#6b7280', label: 'Plain Text', runnable: false, previewable: false, isHtml: false, isMermaid: false },
}

// 1차 기본 추천 언어군 (Quick Access)
export const PRIMARY_LANGUAGES: LanguageItem[] = [
  { id: 'javascript', name: 'JavaScript', color: '#f59e0b', runnable: true },
  { id: 'python',     name: 'Python',     color: '#3b82f6', runnable: true },
  { id: 'sql',        name: 'SQL (SQLite)', color: '#e879f9', runnable: true },
  { id: 'java',       name: 'Java',       color: '#f43f5e', runnable: true },
  { id: 'bash',       name: 'Bash / Shell', color: '#ec4899', runnable: true },
  { id: 'html',       name: 'HTML Sandbox', color: '#f97316', runnable: true, previewable: true },
  { id: 'mermaid',    name: 'Mermaid',    color: '#2563eb', previewable: true },
]

// 도메인별 4대 분류 카테고리 (More Languages 서브메뉴용)
export const LANGUAGE_CATEGORIES: LanguageCategory[] = [
  {
    id: 'web-scripting',
    name: 'Web & Scripting',
    description: '웹 프론트엔드 및 스크립팅 언어',
    languages: [
      { id: 'javascript', name: 'JavaScript', color: '#f59e0b', runnable: true },
      { id: 'typescript', name: 'TypeScript', color: '#60a5fa', runnable: true },
      { id: 'python',     name: 'Python',     color: '#3b82f6', runnable: true },
      { id: 'bash',       name: 'Bash / Shell', color: '#ec4899', runnable: true },
      { id: 'lua',        name: 'Lua',        color: '#38bdf8', runnable: true },
      { id: 'php',        name: 'PHP',        color: '#777bb4', runnable: false },
      { id: 'ruby',       name: 'Ruby',       color: '#cc342d', runnable: false },
    ]
  },
  {
    id: 'systems-native',
    name: 'Systems & Native',
    description: '고성능 시스템 및 네이티브 컴파일 언어',
    languages: [
      { id: 'c',          name: 'C',          color: '#10b981', runnable: true },
      { id: 'cpp',        name: 'C++',        color: '#10b981', runnable: true },
      { id: 'rust',       name: 'Rust',       color: '#dea584', runnable: true },
      { id: 'go',         name: 'Go',         color: '#00add8', runnable: true },
      { id: 'zig',        name: 'Zig',        color: '#f7a41d', runnable: false },
    ]
  },
  {
    id: 'enterprise-oop',
    name: 'Enterprise & OOP',
    description: '엔터프라이즈 객체지향 및 모바일 언어',
    languages: [
      { id: 'java',       name: 'Java',       color: '#f43f5e', runnable: true },
      { id: 'csharp',     name: 'C# (.NET)',  color: '#239120', runnable: false },
      { id: 'kotlin',     name: 'Kotlin',     color: '#7f52ff', runnable: false },
      { id: 'swift',      name: 'Swift',      color: '#f05138', runnable: false },
    ]
  },
  {
    id: 'blockchain-data',
    name: 'Blockchain, Data & Markup',
    description: '스마트 컨트랙트, 통계 분석 및 데이터 규격',
    languages: [
      { id: 'solidity',   name: 'Solidity',   color: '#aa6746', runnable: true },
      { id: 'sql',        name: 'SQL',        color: '#e879f9', runnable: true },
      { id: 'r',          name: 'R',          color: '#276dc3', runnable: false },
      { id: 'html',       name: 'HTML',       color: '#f97316', runnable: true, previewable: true },
      { id: 'mermaid',    name: 'Mermaid',    color: '#2563eb', previewable: true },
      { id: 'markdown',   name: 'Markdown',   color: '#34d399', previewable: true },
      { id: 'json',       name: 'JSON',       color: '#34d399', runnable: false },
      { id: 'xml',        name: 'XML',        color: '#fb923c', runnable: false },
      { id: 'plaintext',  name: 'Plain Text', color: '#6b7280', runnable: false },
    ]
  }
]

// 언어별 기본 스타터 템플릿 (Default Starter Code Templates)
export const DEFAULT_CODE_TEMPLATES: Record<string, string> = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, AMEVA Java Runtime!");
        
        List<String> list = new ArrayList<>();
        list.add("Alpha");
        list.add("Beta");
        list.add("Gamma");
        
        System.out.println("Items: " + list);
    }
}`,

  javascript: `console.log("Hello, AMEVA JavaScript!");

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled values:", doubled);`,

  js: `console.log("Hello, AMEVA JavaScript!");

const numbers = [1, 2, 3, 4, 5];
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));`,

  typescript: `interface User {
  id: number;
  name: string;
  role: string;
}

const user: User = { id: 1, name: "AMEVA Engineer", role: "Admin" };
console.log(\`User: \${user.name} (\${user.role})\`);`,

  ts: `const greeting: string = "Hello, TypeScript!";
console.log(greeting);`,

  python: `import sys

print("Hello, AMEVA Python Runtime!")
print(f"Python: {sys.version.split()[0]}")

matrix = [[i * j for j in range(1, 4)] for i in range(1, 4)]
print("Matrix 3x3:", matrix)`,

  py: `print("Hello from Python!")
print("Math calculation:", [x ** 2 for x in range(5)])`,

  sql: `-- 가상 SQLite 인메모리 데이터베이스
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Active'
);

INSERT INTO projects (name, status) VALUES 
('AMEVA Workstation', 'Production'),
('Neural Engine', 'Developing'),
('Quantum Agent', 'Planned');

SELECT * FROM projects;`,

  bash: `echo "=== AMEVA Virtual Shell ==="
echo "Date & Time: $(date)"
echo "Current User: $(whoami)"
echo "Listing directory:"
ls -la`,

  sh: `echo "Shell script running..."
for item in App Core Engine; do
    echo "Module: $item"
done`,

  solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AmevaStorage {
    string public message = "Hello from Solidity Smart Contract!";
    uint256 public count = 0;

    event MessageUpdated(string newMessage);

    function setMessage(string memory newMessage) public {
        message = newMessage;
        count += 1;
        emit MessageUpdated(newMessage);
    }

    function getSummary() public view returns (string memory, uint256) {
        return (message, count);
    }
}`,

  sol: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    function greet() public pure returns (string memory) {
        return "Hello, Web3 World!";
    }
}`,

  lua: `print("Hello, AMEVA Lua Runtime!")

local list = {10, 20, 30, 40}
local sum = 0
for _, val in ipairs(list) do
    sum = sum + val
end

print("Total Sum: " .. sum)`,

  c: `#include <stdio.h>

int main() {
    printf("Hello, AMEVA C Sandbox!\\n");
    
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("Sum 1..10 = %d\\n", sum);
    
    return 0;
}`,

  cpp: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello, AMEVA C++ Sandbox!" << std::endl;
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int total = std::accumulate(numbers.begin(), numbers.end(), 0);
    
    std::cout << "Vector Total: " << total << std::endl;
    return 0;
}`,

  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, AMEVA Go Runtime!")
    
    fruits := []string{"Apple", "Banana", "Cherry"}
    for idx, fruit := range fruits {
        fmt.Printf("%d: %s\\n", idx+1, fruit)
    }
}`,

  rust: `fn main() {
    println!("Hello, AMEVA Rust Sandbox!");
    
    let numbers = vec![10, 20, 30, 40];
    let total: i32 = numbers.iter().sum();
    
    println!("Vector Sum: {}", total);
}`,

  rs: `fn main() {
    println!("Rust is active!");
}`,

  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .badge { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 12px; }
    h2 { margin: 0 0 8px 0; font-size: 18px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0; }
    .btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">LIVE HTML SANDBOX</span>
    <h2>AMEVA Workstation</h2>
    <p>실시간 스타일링 및 스크립트 실행이 가능한 HTML 프리뷰 환경입니다.</p>
    <button class="btn" onclick="alert('HTML Sandbox Button Clicked!')">인터랙션 테스트</button>
  </div>
</body>
</html>`,

  mermaid: `graph TD
    Client[사용자 브라우저] --> Router{useCodeRuntime 디스패처}
    Router -->|JavaScript| JS[Web Worker Sandbox]
    Router -->|Python| PY[Pyodide WASM Engine]
    Router -->|Java| JV[Java Virtual Worker]
    Router -->|SQL| SQ[SQLite In-Memory DB]
    Router -->|Bash| SH[POSIX Virtual Shell]
    Router -->|Solidity| SOL[EVM Contract Sandbox]`,

  json: `{
  "system": "AMEVA-Workstation-Web",
  "version": "0.8.20",
  "features": {
    "multiLanguageRuntime": true,
    "standaloneWebWorkers": true,
    "cascadingSubmenus": true
  },
  "supportedLanguages": [
    "JavaScript", "TypeScript", "Python", "Java", "SQL",
    "Bash", "Solidity", "Lua", "C", "C++", "Go", "Rust"
  ]
}`,

  xml: `<?xml version="1.0" encoding="UTF-8"?>
<workstation name="AMEVA" version="0.8.20">
    <runtime environment="WebAssembly">
        <modules>
            <module id="java" status="active"/>
            <module id="bash" status="active"/>
            <module id="solidity" status="active"/>
        </modules>
    </runtime>
</workstation>`,

  markdown: `# AMEVA Workstation Markdown
- **고속 실행**: 브라우저 샌드박스
- **수평 확장**: 다중 언어 지원
- **문서화**: 통합 에디터`,

  php: `<?php
echo "Hello, AMEVA PHP Runtime!\\n";
$frameworks = ["Laravel", "Symfony", "WordPress"];
print_r($frameworks);
?>`,

  ruby: `puts "Hello, AMEVA Ruby Runtime!"
skills = ["Architecture", "Frontend", "WASM"]
skills.each_with_index do |skill, index|
  puts "#{index + 1}. #{skill}"
end`,

  r: `# AMEVA R Data Analysis
data <- c(12, 19, 3, 5, 2, 3)
cat("Mean:", mean(data), "\\n")
cat("Summary:\\n")
print(summary(data))`,

  csharp: `using System;
using System.Collections.Generic;

public class Program {
    public static void Main() {
        Console.WriteLine("Hello, AMEVA C# .NET!");
        var items = new List<string> { "Visual", "Studio", "Code" };
        Console.WriteLine(string.Join(" -> ", items));
    }
}`,

  kotlin: `fun main() {
    println("Hello, AMEVA Kotlin Runtime!")
    val numbers = listOf(1, 2, 3, 4, 5)
    println("Evens: " + numbers.filter { it % 2 == 0 })
}`,

  swift: `import Foundation

print("Hello, AMEVA Swift Runtime!")
let greetings = ["Hi", "Bonjour", "Hola"]
for (i, g) in greetings.enumerated() {
    print("\\(i): \\(g)")
}`,

  zig: `const std = @import("std");

pub fn main() void {
    std.debug.print("Hello, AMEVA Zig Sandbox!\\n", .{});
}`,

  plaintext: `// Plain Text & Code Snippet
Write or paste your code here...`,
  text: `// Text Block
Type your notes here...`,
}

export function getDefaultCodeForLanguage(lang: string): string {
  const key = lang.toLowerCase()
  return DEFAULT_CODE_TEMPLATES[key] || DEFAULT_CODE_TEMPLATES['plaintext'] || ''
}

export function isDefaultCodeTemplate(lang: string, code: string): boolean {
  if (!code || code.trim() === '') return true
  const key = lang.toLowerCase()
  const template = DEFAULT_CODE_TEMPLATES[key]
  if (!template) return false
  return code.trim() === template.trim()
}

export function getLangMeta(lang: string): LangMeta {
  return LANG_META[lang.toLowerCase()] ?? {
    color: '#6b7280', label: lang, runnable: false,
    previewable: false, isHtml: false, isMermaid: false,
  }
}
