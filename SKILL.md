---
name: skill-router
description: AI Agent 技能路由器与工作流管理器。作为唯一入口，自动发现、匹配、调用其他 skills，并能学习和固化用户的常用工作流。
version: 1.0.0
author: Gravity
inputs:
  - name: user_intent
    description: 用户的意图或请求
    required: true
outputs:
  - name: result
    description: 执行结果或推荐的 skill/workflow
---

# Skill Router - AI Agent 技能路由器

## 概述

Skill Router 是一个**元技能（Meta-Skill）**，作为 AI Agent 调用其他技能的统一入口。它具备三大核心能力：

1. **智能路由**：根据用户意图自动匹配最合适的 skill
2. **工作流编排**：串联多个 skills 完成复杂任务
3. **模式学习**：记忆用户的操作模式，自动固化为可复用的工作流

## 核心命令

```bash
# 查看所有可用 skills
skill-router list

# 查看精简版列表（适合放入上下文）
skill-router export --brief

# 查看完整路由表
skill-router export

# 查看某个 skill 的详情
skill-router show <skill-id>

# 查看已保存的工作流
skill-router workflow list

# 保存当前会话为工作流
skill-router workflow save <name>
```

## 使用方式

### 作为系统提示词 / Cursor Rules 配置

将以下内容添加到你的系统提示词或 Cursor Rules 中：

```markdown
## Skill Router 配置

你可以通过 skill-router 调用各种 AI 技能。

### 可用技能清单

[在此粘贴 `skill-router export --brief` 的输出]

### 工作流程

1. 当用户提出请求时，首先判断是否需要调用技能
2. 如果需要，从上述清单中匹配最合适的技能
3. 如果任务需要多个技能配合，按逻辑顺序依次调用
4. 执行前向用户确认选择的技能和执行计划

### 工作流记忆

- 当用户连续使用多个技能完成一个任务时，询问是否保存为工作流
- 记住用户的常用模式，下次自动建议
- 用户说"保存这个流程"时，调用 `skill-router workflow save`
```

## 工作流记忆机制

### 自动检测模式

当 Agent 观察到用户在一次会话中连续调用多个 skills 完成一个任务时：

```
用户: 写一篇关于 AI 的公众号文章
Agent: [调用 dankoe-writer 生成初稿]
Agent: [调用 three-writers-council 打磨]
Agent: [调用 baoyu-cover-image 生成封面]
Agent: 文章已完成！我注意到这是一个完整的创作流程，要保存为工作流吗？
用户: 好的，保存为"公众号文章流程"
Agent: [调用 skill-router workflow save "公众号文章流程"]
```

### 工作流存储格式

工作流保存在 `~/.skill-router/workflows.json`：

```json
{
  "workflows": [
    {
      "id": "wechat-article",
      "name": "公众号文章流程",
      "triggers": ["写公众号", "写一篇公众号文章", "公众号长文"],
      "steps": [
        { "skill": "dankoe-writer", "description": "生成初稿" },
        { "skill": "three-writers-council", "description": "三人会议打磨" },
        { "skill": "baoyu-cover-image", "description": "生成封面图" },
        { "skill": "baoyu-post-to-wechat", "description": "发布", "confirm": true }
      ],
      "created": "2025-01-23",
      "usageCount": 5
    }
  ]
}
```

### 自动触发

下次用户说"写公众号"时：

```
用户: 帮我写一篇公众号文章
Agent: 检测到匹配的工作流「公众号文章流程」，包含以下步骤：
  1. dankoe-writer - 生成初稿
  2. three-writers-council - 三人会议打磨  
  3. baoyu-cover-image - 生成封面图
  4. baoyu-post-to-wechat - 发布（需确认）
  
  是否按此流程执行？
用户: 好的
Agent: [开始执行工作流...]
```

## 路由决策逻辑

```
用户输入
    ↓
检查是否匹配已保存的工作流
    ↓ 是 → 提示用户确认 → 执行工作流
    ↓ 否
检查是否匹配单个 skill
    ↓ 是 → 调用该 skill
    ↓ 否
判断是否需要组合多个 skills
    ↓ 是 → 制定执行计划 → 确认 → 依次执行 → 询问是否保存为工作流
    ↓ 否
直接回答（无需调用 skill）
```

## 与其他 Skills 的关系

Skill Router 不替代其他 skills，而是作为**调度层**：

```
┌─────────────────────────────────────────────┐
│              用户 / Agent                    │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│           Skill Router (本技能)              │
│  ┌─────────────────────────────────────┐    │
│  │  路由表 (registry.json)              │    │
│  │  工作流 (workflows.json)             │    │
│  └─────────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  ↓
┌────────┬────────┬────────┬────────┬────────┐
│ skill1 │ skill2 │ skill3 │ skill4 │  ...   │
└────────┴────────┴────────┴────────┴────────┘
```

## 示例场景

### 场景 1：单技能调用

```
用户: 帮我去除这张图片的 Gemini 水印
Agent: [匹配到 gemini-watermark-remover] → 调用执行
```

### 场景 2：多技能编排

```
用户: 把这篇文章做成小红书图片发出去
Agent: 这需要以下步骤：
  1. baoyu-xhs-images - 生成小红书风格图片
  2. (手动发布或未来支持自动发布)
  确认执行？
```

### 场景 3：工作流复用

```
用户: 写公众号
Agent: 检测到已保存的工作流「公众号文章流程」，是否执行？
用户: 这次跳过三人会议，直接生成图
Agent: 好的，调整后的流程：
  1. dankoe-writer
  2. baoyu-cover-image
  开始执行...
```

## 安装与配置

```bash
# 全局安装
npm install -g skill-router

# 初始化（扫描已安装的 skills）
skill-router init

# 添加新 skill
skill-router add <skill-source>
skill-router add-path /path/to/skills --all
```

## 注意事项

1. **确认优先**：涉及发布、删除等不可逆操作时，始终先确认
2. **可中断**：工作流执行过程中，用户可随时说"停止"或"跳过这步"
3. **可调整**：用户可以临时修改工作流步骤，不影响已保存的版本
4. **隐私安全**：路由表和工作流仅存储在本地，不上传任何数据
