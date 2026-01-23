/**
 * Skill Router - Main Module
 * 
 * 提供 skill 发现、注册、管理的核心功能
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, join } from 'path';

import { scanAll, scanProject, scanGlobal, addFromPath, addAllFromPath } from './scanner.js';
import {
  loadRegistry,
  saveRegistry,
  addSkill,
  addSkills,
  removeSkill,
  getSkill,
  listSkills,
  clearRegistry,
  validateRegistry,
  exportForAgent,
  exportForAgentJson,
  exportBrief,
  setBrief,
  getRegistryPath,
} from './registry.js';
import { SKILL_SOURCES, REGISTRY_FILE } from './constants.js';

/**
 * 初始化 registry - 扫描所有已安装的 skills
 * @param {object} options - 选项
 * @param {boolean} options.projectOnly - 只扫描项目级
 * @param {boolean} options.globalOnly - 只扫描全局
 * @param {boolean} options.clear - 清空现有 registry
 * @returns {object} 初始化结果
 */
export async function init(options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  // 可选：清空现有 registry
  if (options.clear) {
    clearRegistry(registryPath);
  }
  
  // 扫描 skills
  let skills = [];
  if (options.projectOnly) {
    skills = scanProject();
  } else if (options.globalOnly) {
    skills = scanGlobal();
  } else {
    skills = scanAll();
  }
  
  // 注册到 registry
  const registry = addSkills(skills, SKILL_SOURCES.SCAN, registryPath);
  
  return {
    registryPath,
    count: skills.length,
    skills: skills.map(s => ({ id: s.id, name: s.name, path: s.path })),
  };
}

/**
 * 刷新 registry - 重新扫描并更新
 * @param {object} options - 选项
 * @returns {object} 刷新结果
 */
export async function refresh(options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  // 保留手动添加的 skills
  const currentRegistry = loadRegistry(registryPath);
  const manualSkills = currentRegistry.skills.filter(
    s => s.source === SKILL_SOURCES.MANUAL || s.source === SKILL_SOURCES.NPX
  );
  
  // 清空并重新扫描
  clearRegistry(registryPath);
  
  // 恢复手动添加的 skills
  if (manualSkills.length > 0) {
    addSkills(manualSkills, null, registryPath); // 保留原来的 source
  }
  
  // 扫描自动发现的 skills
  const scannedSkills = scanAll();
  addSkills(scannedSkills, SKILL_SOURCES.SCAN, registryPath);
  
  const finalRegistry = loadRegistry(registryPath);
  
  return {
    registryPath,
    count: finalRegistry.skills.length,
    manualKept: manualSkills.length,
    scanned: scannedSkills.length,
  };
}

/**
 * 通过 npx add-skill 安装并注册 skill
 * 
 * 支持 Vercel 官方的所有 Source Formats：
 *   - skill-router add <skill-name>                    # 简单名称
 *   - skill-router add vercel-labs/agent-skills        # GitHub shorthand
 *   - skill-router add https://github.com/org/repo     # Full GitHub URL
 *   - skill-router add https://github.com/.../tree/main/skills/xxx  # Direct path
 *   - skill-router add https://gitlab.com/org/repo     # GitLab URL
 *   - skill-router add git@github.com:org/repo.git     # Git SSH URL
 *   - skill-router add <source> --skill <name>         # 指定 skill 名称
 *   - skill-router add --raw "<any npx command>"       # 原始命令
 * 
 * @param {string} source - skill 来源（名称、URL、shorthand 等）
 * @param {object} options - 选项
 * @returns {object} 安装结果
 */
export async function addViaNpx(source, options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  let command;
  let searchTerm = source;
  
  // 判断命令格式
  if (options.raw) {
    // --raw 模式：直接执行用户提供的完整命令
    command = source;
    // 尝试从命令中提取 skill 名称用于后续查找
    const skillMatch = source.match(/--skill\s+(\S+)/);
    if (skillMatch) {
      searchTerm = skillMatch[1];
    }
  } else {
    // 构建 npx add-skill 命令
    // Vercel 的 add-skill 支持所有这些格式，直接传递即可
    command = `npx add-skill ${source}`;
    
    // 如果指定了 --skill，添加到命令中
    if (options.skill) {
      command += ` --skill ${options.skill}`;
      searchTerm = options.skill;
    } else {
      // 尝试从 source 中提取可能的 skill 名称用于后续查找
      searchTerm = extractSkillNameFromSource(source);
    }
  }
  
  // 执行命令
  console.log(`Executing: ${command}`);
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (e) {
    throw new Error(`Failed to install skill: ${e.message}`);
  }
  
  // 等待文件写入完成
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 扫描新安装的 skill
  const skills = scanProject();
  const newSkill = skills.find(s => 
    s.id === searchTerm || 
    s.id.includes(searchTerm) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (newSkill) {
    addSkill(newSkill, SKILL_SOURCES.NPX, registryPath);
    return {
      success: true,
      skill: newSkill,
    };
  } else {
    // 即使没找到特定 skill，也刷新 registry
    await refresh(options);
    return {
      success: true,
      skill: null,
      message: 'Skill installed but could not be identified. Registry refreshed.',
    };
  }
}

/**
 * 从 source 中提取可能的 skill 名称
 * @param {string} source - 来源字符串
 * @returns {string} 提取的名称
 */
function extractSkillNameFromSource(source) {
  // GitHub shorthand: vercel-labs/agent-skills → agent-skills
  if (/^[\w-]+\/[\w-]+$/.test(source)) {
    return source.split('/')[1];
  }
  
  // URL with /tree/main/skills/xxx → xxx
  const treeMatch = source.match(/\/tree\/[^/]+\/skills?\/([\w-]+)/);
  if (treeMatch) {
    return treeMatch[1];
  }
  
  // URL: https://github.com/org/repo → repo
  const urlMatch = source.match(/(?:github\.com|gitlab\.com)[/:][\w-]+\/([\w-]+)/);
  if (urlMatch) {
    return urlMatch[1].replace(/\.git$/, '');
  }
  
  // Git SSH: git@github.com:org/repo.git → repo
  const sshMatch = source.match(/git@[\w.]+:[\w-]+\/([\w-]+)(?:\.git)?$/);
  if (sshMatch) {
    return sshMatch[1];
  }
  
  // 默认返回原始值
  return source;
}

/**
 * 手动添加 skill（通过路径）
 * @param {string} path - SKILL.md 路径或目录路径
 * @param {object} options - 选项
 * @returns {object} 添加结果
 */
export async function addManual(path, options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  const skill = addFromPath(path);
  addSkill(skill, SKILL_SOURCES.MANUAL, registryPath);
  
  return {
    success: true,
    skill,
  };
}

/**
 * 手动添加目录下的所有 skills（递归）
 * @param {string} path - 目录路径
 * @param {object} options - 选项
 * @returns {object} 添加结果
 */
export async function addManualAll(path, options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  const skills = addAllFromPath(path);
  
  if (skills.length === 0) {
    return {
      success: false,
      count: 0,
      skills: [],
      message: `No SKILL.md files found in: ${path}`,
    };
  }
  
  addSkills(skills, SKILL_SOURCES.MANUAL, registryPath);
  
  return {
    success: true,
    count: skills.length,
    skills,
  };
}

/**
 * 移除 skill
 * @param {string} skillId - skill ID
 * @param {object} options - 选项
 * @returns {object} 移除结果
 */
export async function remove(skillId, options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  removeSkill(skillId, registryPath);
  
  return {
    success: true,
    removed: skillId,
  };
}

/**
 * 列出所有 skills
 * @param {object} options - 选项
 * @returns {object[]} skills 列表
 */
export function list(options = {}) {
  const registryPath = getRegistryPath(options.project);
  return listSkills(registryPath);
}

/**
 * 查看 skill 详情
 * @param {string} skillId - skill ID
 * @param {object} options - 选项
 * @returns {object|null} skill 详情
 */
export function show(skillId, options = {}) {
  const registryPath = getRegistryPath(options.project);
  return getSkill(skillId, registryPath);
}

/**
 * 验证 registry
 * @param {object} options - 选项
 * @returns {object} 验证结果
 */
export function validate(options = {}) {
  const registryPath = getRegistryPath(options.project);
  return validateRegistry(registryPath);
}

/**
 * 导出路由表（用于 Agent 上下文）
 * @param {object} options - 选项
 * @param {string} options.format - 格式: 'markdown' | 'json'
 * @returns {string|object} 导出内容
 */
export function exportTable(options = {}) {
  const registryPath = getRegistryPath(options.project);
  
  if (options.format === 'json') {
    return exportForAgentJson(registryPath);
  }
  return exportForAgent(registryPath);
}

/**
 * 导出精简版路由表（减少 token）
 * @param {object} options - 选项
 * @returns {string} 导出内容
 */
export function exportTableBrief(options = {}) {
  const registryPath = getRegistryPath(options.project);
  return exportBrief(registryPath);
}

/**
 * 设置 skill 的 brief
 * @param {string} skillId - skill ID
 * @param {string} brief - 精简描述
 * @param {object} options - 选项
 * @returns {object} 更新后的 skill
 */
export function setSkillBrief(skillId, brief, options = {}) {
  const registryPath = getRegistryPath(options.project);
  return setBrief(skillId, brief, registryPath);
}

// 导出所有子模块功能
export * from './scanner.js';
export * from './registry.js';
export * from './parser.js';
export * from './constants.js';
export * from './workflow.js';
