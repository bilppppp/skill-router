/**
 * Workflow Manager
 * 
 * 管理用户的工作流：保存、加载、匹配、执行
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const WORKFLOWS_FILE = 'workflows.json';

/**
 * 获取工作流文件路径
 * @param {boolean} isProject - 是否使用项目级
 * @returns {string} 工作流文件路径
 */
export function getWorkflowsPath(isProject = false) {
  if (isProject) {
    return join(process.cwd(), '.skill-router', WORKFLOWS_FILE);
  }
  return join(homedir(), '.skill-router', WORKFLOWS_FILE);
}

/**
 * 确保工作流文件目录存在
 * @param {string} workflowsPath - 工作流文件路径
 */
function ensureDir(workflowsPath) {
  const dir = dirname(workflowsPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * 加载工作流数据
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {object} 工作流数据
 */
export function loadWorkflows(workflowsPath) {
  if (!existsSync(workflowsPath)) {
    return { workflows: [], version: '1.0.0' };
  }
  
  try {
    const data = JSON.parse(readFileSync(workflowsPath, 'utf-8'));
    return data;
  } catch (e) {
    return { workflows: [], version: '1.0.0' };
  }
}

/**
 * 保存工作流数据
 * @param {object} data - 工作流数据
 * @param {string} workflowsPath - 工作流文件路径
 */
export function saveWorkflows(data, workflowsPath) {
  ensureDir(workflowsPath);
  data.lastUpdated = new Date().toISOString();
  writeFileSync(workflowsPath, JSON.stringify(data, null, 2));
}

/**
 * 添加新工作流
 * @param {object} workflow - 工作流对象
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {object} 添加结果
 */
export function addWorkflow(workflow, workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  
  // 生成 ID
  if (!workflow.id) {
    workflow.id = workflow.name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // 检查是否已存在
  const existingIndex = data.workflows.findIndex(w => w.id === workflow.id);
  if (existingIndex >= 0) {
    // 更新已有工作流
    data.workflows[existingIndex] = {
      ...data.workflows[existingIndex],
      ...workflow,
      updated: new Date().toISOString(),
    };
  } else {
    // 添加新工作流
    workflow.created = new Date().toISOString();
    workflow.usageCount = 0;
    data.workflows.push(workflow);
  }
  
  saveWorkflows(data, workflowsPath);
  
  return {
    success: true,
    workflow: data.workflows.find(w => w.id === workflow.id),
    isNew: existingIndex < 0,
  };
}

/**
 * 删除工作流
 * @param {string} workflowId - 工作流 ID
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {boolean} 是否成功
 */
export function removeWorkflow(workflowId, workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  const index = data.workflows.findIndex(w => w.id === workflowId);
  
  if (index < 0) {
    return false;
  }
  
  data.workflows.splice(index, 1);
  saveWorkflows(data, workflowsPath);
  
  return true;
}

/**
 * 获取工作流详情
 * @param {string} workflowId - 工作流 ID
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {object|null} 工作流对象
 */
export function getWorkflow(workflowId, workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  return data.workflows.find(w => w.id === workflowId) || null;
}

/**
 * 列出所有工作流
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {object[]} 工作流列表
 */
export function listWorkflows(workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  return data.workflows;
}

/**
 * 根据触发词匹配工作流
 * @param {string} input - 用户输入
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {object|null} 匹配的工作流
 */
export function matchWorkflow(input, workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  const inputLower = input.toLowerCase();
  
  for (const workflow of data.workflows) {
    if (!workflow.triggers) continue;
    
    for (const trigger of workflow.triggers) {
      if (inputLower.includes(trigger.toLowerCase())) {
        return workflow;
      }
    }
  }
  
  return null;
}

/**
 * 增加工作流使用次数
 * @param {string} workflowId - 工作流 ID
 * @param {string} workflowsPath - 工作流文件路径
 */
export function incrementUsage(workflowId, workflowsPath) {
  const data = loadWorkflows(workflowsPath);
  const workflow = data.workflows.find(w => w.id === workflowId);
  
  if (workflow) {
    workflow.usageCount = (workflow.usageCount || 0) + 1;
    workflow.lastUsed = new Date().toISOString();
    saveWorkflows(data, workflowsPath);
  }
}

/**
 * 导出工作流为 Markdown
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {string} Markdown 格式的工作流列表
 */
export function exportWorkflows(workflowsPath) {
  const workflows = listWorkflows(workflowsPath);
  
  if (workflows.length === 0) {
    return '暂无已保存的工作流。';
  }
  
  let md = '## 已保存的工作流\n\n';
  
  for (const wf of workflows) {
    md += `### ${wf.name}\n`;
    md += `- **ID**: ${wf.id}\n`;
    md += `- **触发词**: ${(wf.triggers || []).join('、') || '无'}\n`;
    md += `- **步骤**:\n`;
    
    for (let i = 0; i < (wf.steps || []).length; i++) {
      const step = wf.steps[i];
      md += `  ${i + 1}. \`${step.skill}\` - ${step.description || ''}\n`;
    }
    
    md += `- **使用次数**: ${wf.usageCount || 0}\n`;
    md += '\n';
  }
  
  return md;
}

/**
 * 导出工作流精简版
 * @param {string} workflowsPath - 工作流文件路径
 * @returns {string} 精简的工作流表格
 */
export function exportWorkflowsBrief(workflowsPath) {
  const workflows = listWorkflows(workflowsPath);
  
  if (workflows.length === 0) {
    return '暂无已保存的工作流。';
  }
  
  let md = '| 工作流 | 触发词 | 步骤 |\n';
  md += '|--------|--------|------|\n';
  
  for (const wf of workflows) {
    const triggers = (wf.triggers || []).slice(0, 2).join('、');
    const steps = (wf.steps || []).map(s => s.skill).join(' → ');
    md += `| ${wf.name} | ${triggers} | ${steps} |\n`;
  }
  
  return md;
}
