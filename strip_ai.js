const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'packages/core/src/renderer/components/SettingsModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove AI imports
content = content.replace(/import \{ SettingsTabModels \} from '\.\/settings\/SettingsTabModels'[\r\n]+/g, '');
content = content.replace(/import \{ SettingsTabAIEngine \} from '\.\/settings\/SettingsTabAIEngine'[\r\n]+/g, '');
content = content.replace(/import type \{ AISettings \} from '\.\.\/types\/aiTypes'[\r\n]+/g, '');
content = content.replace(/import \{ Settings, Sliders, Monitor, Move, Bot, ToyBrick, User, Shield, Keyboard, ShieldAlert, Key, Cpu \} from 'lucide-react'/g, "import { Settings, Sliders, Monitor, Move, ToyBrick, User, Shield, Keyboard, ShieldAlert, Key } from 'lucide-react'");
content = content.replace(/export \{ SettingsTabModels \} from '\.\/settings\/SettingsTabModels'[\r\n]+/g, '');
content = content.replace(/export \{ SettingsTabAIEngine \} from '\.\/settings\/SettingsTabAIEngine'[\r\n]+/g, '');

// 2. Remove AI hotkey
content = content.replace(/\s*toggleAI: string[\r\n]+/g, '\n');
content = content.replace(/\s*toggleAI: 'Control\+\\\\',/g, '');

// 3. Remove Props and states
content = content.replace(/\s*aiSettings: AISettings[\r\n]+/g, '\n');
content = content.replace(/\s*onUpdateAISettings: \(newSettings: Partial<AISettings>\) => void[\r\n]+/g, '\n');
content = content.replace(/\s*onOpenModelHub\?: \(\) => void[\r\n]+/g, '\n');
content = content.replace(/type TabType = 'General' \| 'AIEngine' \| 'Account' \| 'Permissions' \| 'Appearance' \| 'Models' \| 'Customizations' \| 'Hotkeys' \| 'MCP' \| 'Credentials'/g, "type TabType = 'General' | 'Account' | 'Permissions' | 'Appearance' | 'Customizations' | 'Hotkeys' | 'MCP' | 'Credentials'");

content = content.replace(/\s*aiSettings,[\r\n]+/g, '\n');
content = content.replace(/\s*onUpdateAISettings,[\r\n]+/g, '\n');
content = content.replace(/\s*onOpenModelHub,[\r\n]+/g, '\n');
content = content.replace(/void \{ Move, ShieldAlert, onOpenModelHub \};/g, 'void { Move, ShieldAlert };');

content = content.replace(/\s*const \[draftAISettings, setDraftAISettings\] = useState<AISettings>\(aiSettings\)[\r\n]+/g, '\n');
content = content.replace(/\s*const \[isAIDirty, setIsAIDirty\] = useState\(false\)[\r\n]+/g, '\n');

content = content.replace(/[\s\n]*\/\*\*[^*]*\*\/[\s\n]*const updateDraftAI = \([^}]*\}[\r\n]+/g, '\n');
// Let's do updateDraftAI differently
content = content.replace(/[\s]*\/\*[\s\S]*?\*\/[\s]*const updateDraftAI = \(updates: Partial<AISettings>\) => \{[\s]*setDraftAISettings\(prev => \(\{ \.\.\.prev, \.\.\.updates \}\)\)[\s]*setIsAIDirty\(true\)[\s]*\}/g, '');

content = content.replace(/[\s]*\/\/ 4\. 모델 탭 스캔 상태[\s]*const \[localModels, setLocalModels\] = useState<import\('\.\.\/services\/ipc\/ipcTypes'\)\.ModelInfo\[\]>\(\[\]\)[\s]*const \[localCodeModels, setLocalCodeModels\] = useState<import\('\.\.\/services\/ipc\/ipcTypes'\)\.ModelInfo\[\]>\(\[\]\)[\s]*const \[gpuName, setGpuName\] = useState<string \| undefined>\(undefined\)/g, '');

content = content.replace(/const isAnyDirty = isAppDirty \|\| isAIDirty \|\| isUserDirty/g, 'const isAnyDirty = isAppDirty || isUserDirty');

content = content.replace(/[\s]*if \(isAIDirty\) onUpdateAISettings\(draftAISettings\)/g, '');
content = content.replace(/[\s]*setDraftAISettings\(aiSettings\)/g, '');
content = content.replace(/[\s]*setIsAIDirty\(false\)/g, '');

content = content.replace(/[\s]*useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen, activeTab\]\)/g, '');

content = content.replace(/[\s]*\/\*[\s\S]*?\*\/[\s]*const startModelDownload = async \(url: string, filename: string, type: 'llm' \| 'code'\) => \{[\s\S]*?store\.addDownloadToQueue\(\{[\s\S]*?\}\)[\s]*\}/g, '');

// Tabs
content = content.replace(/[\s]*\{ id: 'AIEngine', label: 'AI Engine', icon: Cpu \},/g, '');
content = content.replace(/[\s]*\{ id: 'Models', label: 'Models', icon: Bot \},/g, '');

// Tab renderings
content = content.replace(/[\s]*\{\/\* AIEngine Tab \*\/\}(.|\n)*?canUseMCP=\{canUseMCP\}(.|\n)*?\/>/g, '');
content = content.replace(/[\s]*\{\/\* Models Tab \*\/\}(.|\n)*?startModelDownload=\{startModelDownload\}(.|\n)*?\/>/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Success');
