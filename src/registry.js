/**
 * Registry Manager
 * 
 * 管理 skill 路由表（registry.json）
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import {
  REGISTRY_DIR,
  REGISTRY_FILE,
  PROJECT_REGISTRY_FILE,
  REGISTRY_VERSION,
  SKILL_SOURCES,
} from './constants.js';

/**
 * 创建空的 registry 结构
 * @returns {object} 空的 registry
 */
function createEmptyRegistry() {
  return {
    version: REGISTRY_VERSION,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    skills: [],
  };
}

/**
 * 确保 registry 目录存在
 * @param {string} registryPath - registry 文件路径
 */
function ensureRegistryDir(registryPath) {
  const dir = dirname(registryPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * 加载 registry
 * @param {string} registryPath - registry 文件路径（可选，默认全局）
 * @returns {object} registry 对象
 */
export function loadRegistry(registryPath = REGISTRY_FILE) {
  if (!existsSync(registryPath)) {
    return createEmptyRegistry();
  }
  
  try {
    const content = readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(content);
    
    // 确保有必要的字段
    if (!registry.version) registry.version = REGISTRY_VERSION;
    if (!registry.skills) registry.skills = [];
    
    return registry;
  } catch (e) {
    console.error(`Failed to load registry: ${e.message}`);
    return createEmptyRegistry();
  }
}

/**
 * 保存 registry
 * @param {object} registry - registry 对象
 * @param {string} registryPath - registry 文件路径（可选，默认全局）
 */
export function saveRegistry(registry, registryPath = REGISTRY_FILE) {
  ensureRegistryDir(registryPath);
  
  registry.updated_at = new Date().toISOString();
  
  const content = JSON.stringify(registry, null, 2);
  writeFileSync(registryPath, content, 'utf-8');
}

/**
 * 添加 skill 到 registry
 * @param {object} skill - skill 信息
 * @param {string} source - 来源类型
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 更新后的 registry
 */
export function addSkill(skill, source = SKILL_SOURCES.SCAN, registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  // 检查是否已存在
  const existingIndex = registry.skills.findIndex(
    s => s.id === skill.id || s.manifest === skill.manifest
  );
  
  const skillEntry = {
    ...skill,
    source,
    registered_at: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    // 更新现有条目
    registry.skills[existingIndex] = {
      ...registry.skills[existingIndex],
      ...skillEntry,
      updated_at: new Date().toISOString(),
    };
  } else {
    // 添加新条目
    registry.skills.push(skillEntry);
  }
  
  saveRegistry(registry, registryPath);
  return registry;
}

/**
 * 批量添加 skills 到 registry
 * @param {object[]} skills - skills 列表
 * @param {string} source - 来源类型
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 更新后的 registry
 */
export function addSkills(skills, source = SKILL_SOURCES.SCAN, registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  for (const skill of skills) {
    const existingIndex = registry.skills.findIndex(
      s => s.id === skill.id || s.manifest === skill.manifest
    );
    
    const skillEntry = {
      ...skill,
      source,
      registered_at: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      registry.skills[existingIndex] = {
        ...registry.skills[existingIndex],
        ...skillEntry,
        updated_at: new Date().toISOString(),
      };
    } else {
      registry.skills.push(skillEntry);
    }
  }
  
  saveRegistry(registry, registryPath);
  return registry;
}

/**
 * 从 registry 移除 skill
 * @param {string} skillId - skill ID
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 更新后的 registry
 */
export function removeSkill(skillId, registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  const index = registry.skills.findIndex(s => s.id === skillId);
  if (index < 0) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  
  registry.skills.splice(index, 1);
  saveRegistry(registry, registryPath);
  return registry;
}

/**
 * 获取 skill 信息
 * @param {string} skillId - skill ID
 * @param {string} registryPath - registry 文件路径
 * @returns {object|null} skill 信息
 */
export function getSkill(skillId, registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  return registry.skills.find(s => s.id === skillId) || null;
}

/**
 * 列出所有 skills
 * @param {string} registryPath - registry 文件路径
 * @returns {object[]} skills 列表
 */
export function listSkills(registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  return registry.skills;
}

/**
 * 清空 registry
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 空的 registry
 */
export function clearRegistry(registryPath = REGISTRY_FILE) {
  const registry = createEmptyRegistry();
  saveRegistry(registry, registryPath);
  return registry;
}

/**
 * 验证 registry 中的路径是否有效
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 验证结果 { valid: [], invalid: [] }
 */
export function validateRegistry(registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  const result = { valid: [], invalid: [] };
  
  for (const skill of registry.skills) {
    if (existsSync(skill.manifest)) {
      result.valid.push(skill);
    } else {
      result.invalid.push(skill);
    }
  }
  
  return result;
}

/**
 * 导出 registry 为简化的路由表格式（用于 Agent 上下文）
 * @param {string} registryPath - registry 文件路径
 * @returns {string} 格式化的路由表
 */
export function exportForAgent(registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  let output = '# Skill 路由表\n\n';
  output += '以下是当前可用的 Skills 列表：\n\n';
  
  for (const skill of registry.skills) {
    output += `## ${skill.name} (${skill.id})\n`;
    output += `- **描述**: ${skill.description}\n`;
    output += `- **路径**: ${skill.manifest}\n`;
    
    if (skill.inputs && skill.inputs.length > 0) {
      output += `- **输入**: ${skill.inputs.join(', ')}\n`;
    }
    if (skill.outputs && skill.outputs.length > 0) {
      output += `- **输出**: ${skill.outputs.join(', ')}\n`;
    }
    if (skill.tags && skill.tags.length > 0) {
      output += `- **标签**: ${skill.tags.join(', ')}\n`;
    }
    
    output += '\n';
  }
  
  return output;
}

/**
 * 导出精简版路由表（一句话描述，用于减少 token）
 * @param {string} registryPath - registry 文件路径
 * @returns {string} 精简的路由表
 */
export function exportBrief(registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  if (registry.skills.length === 0) {
    return '# Skill 路由表（精简版）\n\n暂无已注册的 Skills。\n';
  }
  
  let output = '# Skill 路由表（精简版）\n\n';
  output += `共 ${registry.skills.length} 个可用 Skills：\n\n`;
  output += '| ID | 名称 | 简介 |\n';
  output += '|----|------|------|\n';
  
  for (const skill of registry.skills) {
    const brief = skill.brief || skill.description?.slice(0, 50) || '暂无描述';
    // 转义表格中的 | 字符
    const safeBrief = brief.replace(/\|/g, '\\|');
    const safeName = (skill.name || skill.id).replace(/\|/g, '\\|');
    output += `| ${skill.id} | ${safeName} | ${safeBrief} |\n`;
  }
  
  output += '\n---\n\n';
  output += '**使用方式**：如需使用某个 skill，请先读取其完整 SKILL.md：\n\n';
  output += '```\n';
  output += '1. 根据任务判断需要哪个 skill\n';
  output += '2. 使用 Read 工具读取该 skill 的 manifest 文件\n';
  output += '3. 按照 SKILL.md 中的流程执行\n';
  output += '```\n\n';
  output += '可通过 `skill-router show <id>` 查看 skill 的 manifest 路径。\n';
  
  return output;
}

/**
 * 设置 skill 的 brief（精简描述）
 * @param {string} skillId - skill ID
 * @param {string} brief - 精简描述
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 更新后的 skill
 */
export function setBrief(skillId, brief, registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  const skill = registry.skills.find(s => s.id === skillId);
  if (!skill) {
    throw new Error(`Skill not found: ${skillId}`);
  }
  
  skill.brief = brief;
  skill.updated_at = new Date().toISOString();
  
  saveRegistry(registry, registryPath);
  return skill;
}

/**
 * 导出 registry 为 JSON 格式（精简版，用于 Agent 上下文）
 * @param {string} registryPath - registry 文件路径
 * @returns {object} 精简的路由表
 */
export function exportForAgentJson(registryPath = REGISTRY_FILE) {
  const registry = loadRegistry(registryPath);
  
  return {
    count: registry.skills.length,
    skills: registry.skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      inputs: s.inputs,
      outputs: s.outputs,
      tags: s.tags,
      manifest: s.manifest,
    })),
  };
}

/**
 * 获取 registry 文件路径
 * @param {boolean} useProjectRegistry - 是否使用项目级 registry
 * @returns {string} registry 文件路径
 */
export function getRegistryPath(useProjectRegistry = false) {
  if (useProjectRegistry) {
    const projectPath = `${process.cwd()}/${PROJECT_REGISTRY_FILE}`;
    return projectPath;
  }
  return REGISTRY_FILE;
}
