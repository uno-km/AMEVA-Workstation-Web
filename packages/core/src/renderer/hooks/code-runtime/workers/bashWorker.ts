/**
 * ============================================================================
 * @file bashWorker.ts
 * @system AMEVA OS Desktop Workstation / Web
 * @location packages/core/src/renderer/hooks/code-runtime/workers/bashWorker.ts
 * @role Virtual POSIX Shell & Bash Sandbox Web Worker
 * ============================================================================
 */

interface VirtualFS {
  [path: string]: string | VirtualFS
}

const vfs: VirtualFS = {
  '/': {
    'home': {
      'user': {
        'projects': {
          'README.md': '# AMEVA Virtual Shell Workspace\nReady for scripting.',
          'app.sh': '#!/bin/bash\necho "App initialized successfully."',
        }
      }
    },
    'etc': {
      'os-release': 'NAME="AMEVA OS Web"\nVERSION="0.8.20"\nID=ameva\nPRETTY_NAME="AMEVA Workstation OS"',
    }
  }
}

let cwd = '/home/user'
const env: Record<string, string> = {
  USER: 'ameva',
  HOME: '/home/user',
  SHELL: '/bin/bash',
  PATH: '/bin:/usr/bin:/usr/local/bin',
  TERM: 'xterm-256color',
  PWD: cwd,
}

function resolvePath(path: string): string {
  if (path.startsWith('/')) return path
  if (path === '~' || path.startsWith('~/')) return path.replace('~', '/home/user')
  return (cwd === '/' ? '' : cwd) + '/' + path
}

function getVFSItem(path: string): any {
  const normalized = resolvePath(path).split('/').filter(Boolean)
  let current: any = vfs['/']
  for (const part of normalized) {
    if (!current || typeof current !== 'object') return null
    current = current[part]
  }
  return current
}

function executeCommand(cmdLine: string): { output: string; exitCode: number } {
  const trimmed = cmdLine.trim()
  if (!trimmed || trimmed.startsWith('#')) return { output: '', exitCode: 0 }

  // 환경변수 치환: $VAR 또는 ${VAR}
  let line = trimmed.replace(/\$\{?([a-zA-Z0-9_]+)\}?/g, (_, varName) => {
    return env[varName] !== undefined ? env[varName] : ''
  })

  // 커맨드 치환: $(date) 또는 `date`
  line = line.replace(/\$\(([^)]+)\)|`([^`]+)`/g, (_, c1, c2) => {
    const sub = executeCommand(c1 || c2)
    return sub.output.trim()
  })

  const tokens = line.split(/\s+/)
  const cmd = tokens[0]
  const args = tokens.slice(1)

  switch (cmd) {
    case 'echo':
      return { output: args.join(' '), exitCode: 0 }

    case 'pwd':
      return { output: cwd, exitCode: 0 }

    case 'whoami':
      return { output: env.USER || 'ameva', exitCode: 0 }

    case 'uname':
      if (args.includes('-a')) {
        return { output: 'Linux ameva-workstation 6.6.0-wasm #1 SMP PREEMPT WebAssembly x86_64 GNU/Linux', exitCode: 0 }
      }
      return { output: 'Linux', exitCode: 0 }

    case 'date':
      return { output: new Date().toUTCString(), exitCode: 0 }

    case 'ls': {
      const targetPath = args.find(a => !a.startsWith('-')) || cwd
      const item = getVFSItem(targetPath)
      if (item && typeof item === 'object') {
        const list = Object.keys(item)
        if (args.includes('-la') || args.includes('-l')) {
          const rows = list.map(f => {
            const isDir = typeof item[f] === 'object'
            return `${isDir ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ameva ameva 4096 Sep 02 12:00 ${f}`
          })
          return { output: `total ${list.length}\n${rows.join('\n')}`, exitCode: 0 }
        }
        return { output: list.join('  '), exitCode: 0 }
      }
      return { output: `ls: cannot access '${targetPath}': No such file or directory`, exitCode: 1 }
    }

    case 'cat': {
      const filename = args[0]
      if (!filename) return { output: 'cat: missing file operand', exitCode: 1 }
      const item = getVFSItem(filename)
      if (typeof item === 'string') return { output: item, exitCode: 0 }
      if (typeof item === 'object') return { output: `cat: ${filename}: Is a directory`, exitCode: 1 }
      return { output: `cat: ${filename}: No such file or directory`, exitCode: 1 }
    }

    case 'cd': {
      const target = args[0] || '/home/user'
      const newPath = resolvePath(target)
      const item = getVFSItem(newPath)
      if (item && typeof item === 'object') {
        cwd = newPath
        env.PWD = cwd
        return { output: '', exitCode: 0 }
      }
      return { output: `cd: ${target}: No such file or directory`, exitCode: 1 }
    }

    case 'export': {
      const assign = args.join(' ')
      const [k, v] = assign.split('=')
      if (k && v !== undefined) {
        env[k.trim()] = v.replace(/^["']|["']$/g, '').trim()
      }
      return { output: '', exitCode: 0 }
    }

    case 'env':
      return {
        output: Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'),
        exitCode: 0
      }

    case 'clear':
      return { output: '', exitCode: 0 }

    default:
      return {
        output: `[Virtual Shell] ${cmd}: command executed (virtual exit 0)`,
        exitCode: 0
      }
  }
}

function runScript(script: string): { output: string; success: boolean } {
  const lines = script.split('\n')
  const results: string[] = []
  let isOverallSuccess = true

  // For 루프 파싱
  let inForLoop = false
  let forVar = ''
  let forItems: string[] = []
  let forBody: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()
    if (!rawLine || rawLine.startsWith('#')) continue

    // for VAR in ITEM1 ITEM2; do
    const forMatch = rawLine.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(.+?)(?:;\s*do)?$/)
    if (forMatch) {
      inForLoop = true
      forVar = forMatch[1]
      forItems = forMatch[2].replace(/;.*$/, '').split(/\s+/).filter(Boolean)
      forBody = []
      continue
    }

    if (inForLoop) {
      if (rawLine === 'do') continue
      if (rawLine === 'done') {
        inForLoop = false
        // For 루프 본문 반복 실행
        for (const item of forItems) {
          env[forVar] = item
          for (const bodyCmd of forBody) {
            const res = executeCommand(bodyCmd)
            if (res.output) results.push(res.output)
            if (res.exitCode !== 0) isOverallSuccess = false
          }
        }
        delete env[forVar]
        continue
      }
      forBody.push(rawLine)
      continue
    }

    const res = executeCommand(rawLine)
    if (res.output) results.push(res.output)
    if (res.exitCode !== 0) isOverallSuccess = false
  }

  return {
    output: results.join('\n') || '(실행 완료 - 출력 없음)',
    success: isOverallSuccess
  }
}

self.onmessage = function (e: MessageEvent) {
  const code = e.data || ''
  try {
    const result = runScript(code)
    self.postMessage(result)
  } catch (err: any) {
    self.postMessage({
      success: false,
      output: '[Bash Runtime Error] ' + (err.message || String(err))
    })
  }
}
