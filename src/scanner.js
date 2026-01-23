/**
 * Skill Scanner
 * 
 * 扫描指定路径下的 skills
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, basename } from 'path';
import { glob } from 'glob';
import {
  SKILL_SEARCH_PATHS,
  SKILL_MANIFEST_NAMES,
  FALLBACK_MANIFEST_NAMES,
  GLOBAL_SEARCH_ROOTS,
} from './constants.js';
import { parseSkillManifest } from './parser.js';

/**
 * 在指定目录中查找 skill manifest 文件
 * @param {string} dir - 目录路径
 * @returns {string|null} manifest 文件路径
 */
function findManifestInDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return null;
  }
  
  // 首先查找标准的 SKILL.md 等文件
  for (const name of SKILL_MANIFEST_NAMES) {
    const filePath = join(dir, name);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  
  // Fallback: 查找 README.md
  for (const name of FALLBACK_MANIFEST_NAMES) {
    const filePath = join(dir, name);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  
  return null;
}

/**
 * 扫描单个根目录下的所有 skills
 * @param {string} rootDir - 根目录
 * @returns {object[]} 发现的 skills 列表
 */
export function scanDirectory(rootDir) {
  const skills = [];
  const absoluteRoot = resolve(rootDir);
  
  if (!existsSync(absoluteRoot)) {
    return skills;
  }
  
  // 检查根目录本身是否是一个 skill
  const rootManifest = findManifestInDir(absoluteRoot);
  if (rootManifest && basename(absoluteRoot) !== 'skills') {
    const skill = parseSkillManifest(rootManifest);
    if (skill) {
      skills.push(skill);
    }
  }
  
  // 遍历所有搜索路径
  for (const searchPath of SKILL_SEARCH_PATHS) {
    const fullSearchPath = join(absoluteRoot, searchPath);
    
    if (!existsSync(fullSearchPath)) {
      continue;
    }
    
    const stat = statSync(fullSearchPath);
    
    if (stat.isDirectory()) {
      // 如果是 skills 目录，扫描其子目录
      if (searchPath.includes('skills')) {
        try {
          const entries = readdirSync(fullSearchPath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const skillDir = join(fullSearchPath, entry.name);
              const manifest = findManifestInDir(skillDir);
              if (manifest) {
                const skill = parseSkillManifest(manifest);
                if (skill) {
                  // 避免重复
                  if (!skills.find(s => s.manifest === skill.manifest)) {
                    skills.push(skill);
                  }
                }
              }
            }
          }
        } catch (e) {
          // 忽略权限错误等
        }
      } else {
        // 检查目录本身是否是 skill
        const manifest = findManifestInDir(fullSearchPath);
        if (manifest) {
          const skill = parseSkillManifest(manifest);
          if (skill && !skills.find(s => s.manifest === skill.manifest)) {
            skills.push(skill);
          }
        }
      }
    }
  }
  
  return skills;
}

/**
 * 扫描当前项目的 skills
 * @param {string} projectDir - 项目目录（默认为当前工作目录）
 * @returns {object[]} 发现的 skills 列表
 */
export function scanProject(projectDir = process.cwd()) {
  return scanDirectory(projectDir);
}

/**
 * 扫描全局 skills
 * @returns {object[]} 发现的 skills 列表
 */
export function scanGlobal() {
  const skills = [];
  
  for (const root of GLOBAL_SEARCH_ROOTS) {
    const found = scanDirectory(root);
    for (const skill of found) {
      if (!skills.find(s => s.manifest === skill.manifest)) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}

/**
 * 扫描所有 skills（项目 + 全局）
 * @param {string} projectDir - 项目目录
 * @returns {object[]} 发现的 skills 列表
 */
export function scanAll(projectDir = process.cwd()) {
  const projectSkills = scanProject(projectDir);
  const globalSkills = scanGlobal();
  
  // 合并，项目级优先
  const allSkills = [...projectSkills];
  for (const skill of globalSkills) {
    if (!allSkills.find(s => s.id === skill.id)) {
      allSkills.push(skill);
    }
  }
  
  return allSkills;
}

/**
 * 从指定的 manifest 路径添加 skill
 * @param {string} manifestPath - SKILL.md 或目录路径
 * @returns {object|null} 解析出的 skill 信息
 */
export function addFromPath(manifestPath) {
  const absolutePath = resolve(manifestPath);
  
  if (!existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }
  
  const stat = statSync(absolutePath);
  
  let manifest;
  if (stat.isDirectory()) {
    // 如果是目录，查找其中的 manifest
    manifest = findManifestInDir(absolutePath);
    if (!manifest) {
      throw new Error(`No SKILL.md found in directory: ${absolutePath}`);
    }
  } else {
    // 如果是文件，直接使用
    manifest = absolutePath;
  }
  
  const skill = parseSkillManifest(manifest);
  if (!skill) {
    throw new Error(`Failed to parse manifest: ${manifest}`);
  }
  
  return skill;
}

/**
 * 从指定目录递归添加所有 skills
 * @param {string} dirPath - 目录路径
 * @param {number} maxDepth - 最大递归深度（默认 5）
 * @returns {object[]} 发现的所有 skills
 */
export function addAllFromPath(dirPath, maxDepth = 5) {
  const absolutePath = resolve(dirPath);
  
  if (!existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }
  
  const stat = statSync(absolutePath);
  
  // 如果是文件，当作单个 skill 处理
  if (!stat.isDirectory()) {
    const skill = parseSkillManifest(absolutePath);
    return skill ? [skill] : [];
  }
  
  // 递归扫描目录
  return scanDirectoryRecursive(absolutePath, 0, maxDepth);
}

/**
 * 递归扫描目录中的所有 skills
 * @param {string} dirPath - 目录路径
 * @param {number} depth - 当前递归深度
 * @param {number} maxDepth - 最大递归深度
 * @returns {object[]} 发现的 skills
 */
function scanDirectoryRecursive(dirPath, depth = 0, maxDepth = 5) {
  const skills = [];
  
  if (depth > maxDepth) {
    return skills;
  }
  
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return skills;
  }
  
  // 检查当前目录是否有 manifest
  const manifest = findManifestInDir(dirPath);
  if (manifest) {
    const skill = parseSkillManifest(manifest);
    if (skill) {
      skills.push(skill);
      // 找到 skill 后不再递归其子目录（避免重复）
      return skills;
    }
  }
  
  // 继续递归子目录
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      // 跳过隐藏目录和 node_modules
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const subDirPath = join(dirPath, entry.name);
        const subSkills = scanDirectoryRecursive(subDirPath, depth + 1, maxDepth);
        for (const skill of subSkills) {
          // 避免重复
          if (!skills.find(s => s.manifest === skill.manifest)) {
            skills.push(skill);
          }
        }
      }
    }
  } catch (e) {
    // 忽略权限错误等
  }
  
  return skills;
}

/**
 * 使用 glob 模式搜索 skills
 * @param {string} pattern - glob 模式
 * @param {string} cwd - 工作目录
 * @returns {object[]} 发现的 skills 列表
 */
export async function scanWithGlob(pattern, cwd = process.cwd()) {
  const skills = [];
  
  const files = await glob(pattern, { cwd, absolute: true });
  
  for (const file of files) {
    // 检查是否是 manifest 文件
    const filename = basename(file);
    if (SKILL_MANIFEST_NAMES.includes(filename) || FALLBACK_MANIFEST_NAMES.includes(filename)) {
      const skill = parseSkillManifest(file);
      if (skill && !skills.find(s => s.manifest === skill.manifest)) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}
