/**
 * Skill Router Constants
 * 
 * 包含探测路径、配置文件名等常量
 * 探测路径参考 Vercel add-skill 官方清单
 */

import { homedir } from 'os';
import { join } from 'path';

// Vercel 官方 Skill 探测路径清单
// 按优先级排序，越靠前优先级越高
export const SKILL_SEARCH_PATHS = [
  // 根目录（如果包含 SKILL.md）
  '.',
  
  // 通用 skills 目录
  'skills',
  'skills/.curated',
  'skills/.experimental',
  'skills/.system',
  
  // 各种 Agent/IDE 的 skills 目录
  '.agents/skills',
  '.agent/skills',
  '.claude/skills',
  '.cline/skills',
  '.codex/skills',
  '.commandcode/skills',
  '.cursor/skills',
  '.factory/skills',
  '.gemini/skills',
  '.github/skills',
  '.goose/skills',
  '.kilocode/skills',
  '.kiro/skills',
  '.opencode/skills',
  '.openhands/skills',
  '.pi/skills',
  '.qoder/skills',
  '.roo/skills',
  '.trae/skills',
  '.windsurf/skills',
  '.zencoder/skills',
  '.neovate/skills',
];

// Skill Manifest 文件名（按优先级）
export const SKILL_MANIFEST_NAMES = [
  'SKILL.md',
  'skill.md',
  'Skill.md',
  'SKILL.yaml',
  'skill.yaml',
  'SKILL.json',
  'skill.json',
];

// Fallback: 如果没有找到 SKILL.md，尝试这些文件
export const FALLBACK_MANIFEST_NAMES = [
  'README.md',
  'readme.md',
  'Readme.md',
];

// Registry 文件路径
export const REGISTRY_DIR = join(homedir(), '.skill-router');
export const REGISTRY_FILE = join(REGISTRY_DIR, 'registry.json');

// 项目级 Registry（可选）
export const PROJECT_REGISTRY_FILE = '.skill-router/registry.json';

// 默认的全局 skills 搜索根目录
export const GLOBAL_SEARCH_ROOTS = [
  join(homedir(), '.cursor', 'skills'),
  join(homedir(), '.skills'),
  join(homedir(), 'skills'),
];

// Skill 来源类型
export const SKILL_SOURCES = {
  NPX: 'npx',           // 通过 npx add-skill 安装
  MANUAL: 'manual',     // 手动添加路径
  GITHUB: 'github',     // 从 GitHub 克隆
  SCAN: 'scan',         // 自动扫描发现
};

// Registry 版本
export const REGISTRY_VERSION = '1.0';
