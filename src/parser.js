/**
 * Skill Manifest Parser
 * 
 * 解析 SKILL.md / SKILL.yaml / SKILL.json 文件
 * 提取 skill 的元数据
 */

import { readFileSync, existsSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import YAML from 'yaml';

/**
 * 从 Markdown frontmatter 中提取元数据
 * @param {string} content - Markdown 文件内容
 * @returns {object} 解析出的 frontmatter 对象
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    try {
      return YAML.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse frontmatter:', e.message);
      return {};
    }
  }
  return {};
}

/**
 * 从 Markdown 内容中提取描述
 * @param {string} content - Markdown 文件内容
 * @returns {string} 提取的描述
 */
function extractDescription(content) {
  // 移除 frontmatter
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  
  // 尝试提取第一个标题后的第一段
  const lines = withoutFrontmatter.split('\n');
  let foundTitle = false;
  let description = '';
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith('#')) {
      description = line.trim();
      break;
    }
  }
  
  // 如果没找到，取前 200 字符
  if (!description) {
    description = withoutFrontmatter.trim().slice(0, 200);
  }
  
  return description;
}

/**
 * 从 Markdown 内容中提取标题
 * @param {string} content - Markdown 文件内容
 * @returns {string|null} 提取的标题
 */
function extractTitle(content) {
  const titleRegex = /^#\s+(.+)$/m;
  const match = content.match(titleRegex);
  return match ? match[1].trim() : null;
}

/**
 * 解析 SKILL.md 文件
 * @param {string} filePath - SKILL.md 文件路径
 * @returns {object|null} 解析出的 skill 信息
 */
export function parseSkillMd(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    
    // 提取基本信息
    const skillDir = dirname(filePath);
    const defaultId = basename(skillDir);
    
    const skill = {
      id: frontmatter.name || frontmatter.id || defaultId,
      name: frontmatter.name || extractTitle(content) || defaultId,
      description: frontmatter.description || extractDescription(content),
      path: skillDir,
      manifest: filePath,
      
      // 输入输出（如果在 frontmatter 中定义）
      inputs: frontmatter.inputs || [],
      outputs: frontmatter.outputs || [],
      
      // 其他元数据
      version: frontmatter.version || '1.0.0',
      author: frontmatter.author || null,
      tags: frontmatter.tags || frontmatter.keywords || [],
      
      // 依赖的其他文件
      references: extractReferences(content, skillDir),
    };
    
    return skill;
  } catch (e) {
    console.error(`Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

/**
 * 解析 SKILL.yaml 文件
 * @param {string} filePath - SKILL.yaml 文件路径
 * @returns {object|null} 解析出的 skill 信息
 */
export function parseSkillYaml(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = YAML.parse(content);
    const skillDir = dirname(filePath);
    const defaultId = basename(skillDir);
    
    return {
      id: data.name || data.id || defaultId,
      name: data.name || defaultId,
      description: data.description || '',
      path: skillDir,
      manifest: filePath,
      inputs: data.inputs || [],
      outputs: data.outputs || [],
      version: data.version || '1.0.0',
      author: data.author || null,
      tags: data.tags || data.keywords || [],
      references: data.references || [],
    };
  } catch (e) {
    console.error(`Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

/**
 * 解析 SKILL.json 文件
 * @param {string} filePath - SKILL.json 文件路径
 * @returns {object|null} 解析出的 skill 信息
 */
export function parseSkillJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    const skillDir = dirname(filePath);
    const defaultId = basename(skillDir);
    
    return {
      id: data.name || data.id || defaultId,
      name: data.name || defaultId,
      description: data.description || '',
      path: skillDir,
      manifest: filePath,
      inputs: data.inputs || [],
      outputs: data.outputs || [],
      version: data.version || '1.0.0',
      author: data.author || null,
      tags: data.tags || data.keywords || [],
      references: data.references || [],
    };
  } catch (e) {
    console.error(`Failed to parse ${filePath}:`, e.message);
    return null;
  }
}

/**
 * 从 Markdown 中提取引用的其他文件
 * @param {string} content - Markdown 内容
 * @param {string} skillDir - skill 目录
 * @returns {string[]} 引用的文件列表
 */
function extractReferences(content, skillDir) {
  const references = [];
  
  // 匹配 Markdown 中的文件引用，如 `council-kazike.md`
  const backtickRefs = content.match(/`([^`]+\.(?:md|yaml|json|txt))`/g) || [];
  for (const ref of backtickRefs) {
    const filename = ref.replace(/`/g, '');
    const fullPath = join(skillDir, filename);
    if (existsSync(fullPath)) {
      references.push(filename);
    }
  }
  
  // 匹配列表中的文件引用，如 - council-kazike.md
  const listRefs = content.match(/^[-*]\s+([^\n]+\.(?:md|yaml|json|txt))/gm) || [];
  for (const ref of listRefs) {
    const filename = ref.replace(/^[-*]\s+/, '').trim();
    const fullPath = join(skillDir, filename);
    if (existsSync(fullPath) && !references.includes(filename)) {
      references.push(filename);
    }
  }
  
  return references;
}

/**
 * 自动检测并解析 skill manifest 文件
 * @param {string} filePath - manifest 文件路径
 * @returns {object|null} 解析出的 skill 信息
 */
export function parseSkillManifest(filePath) {
  const ext = extname(filePath).toLowerCase();
  
  let skill;
  switch (ext) {
    case '.md':
      skill = parseSkillMd(filePath);
      break;
    case '.yaml':
    case '.yml':
      skill = parseSkillYaml(filePath);
      break;
    case '.json':
      skill = parseSkillJson(filePath);
      break;
    default:
      // 尝试作为 Markdown 解析
      skill = parseSkillMd(filePath);
  }
  
  // 自动生成 brief
  if (skill && !skill.brief) {
    skill.brief = generateBrief(skill.description);
  }
  
  return skill;
}

/**
 * 生成精简的一句话描述
 * @param {string} description - 完整描述
 * @param {number} maxLength - 最大长度（默认 60）
 * @returns {string} 精简描述
 */
export function generateBrief(description, maxLength = 60) {
  if (!description) return '暂无描述';
  
  // 清理换行和多余空格
  const cleaned = description.replace(/\s+/g, ' ').trim();
  
  // 如果本身就短，直接用
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // 取第一句（到第一个句号/。/./！/!/?/？/换行）
  const sentenceEnd = /[。.！!?？\n]/;
  const firstSentenceMatch = cleaned.match(sentenceEnd);
  
  if (firstSentenceMatch && firstSentenceMatch.index < maxLength) {
    const firstSentence = cleaned.slice(0, firstSentenceMatch.index);
    if (firstSentence.length >= 10) { // 确保第一句不是太短
      return firstSentence;
    }
  }
  
  // 尝试在逗号/顿号处截断
  const commaEnd = /[，,、]/;
  let lastGoodBreak = -1;
  for (let i = 0; i < Math.min(cleaned.length, maxLength); i++) {
    if (commaEnd.test(cleaned[i])) {
      lastGoodBreak = i;
    }
  }
  
  if (lastGoodBreak > 20) {
    return cleaned.slice(0, lastGoodBreak);
  }
  
  // 还是太长，截断 + 省略号
  return cleaned.slice(0, maxLength - 3).trim() + '...';
}
