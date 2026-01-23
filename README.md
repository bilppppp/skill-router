# Skill Router

一个用于发现、注册和管理 AI Agent Skills 的 CLI 工具。

灵感来源于网络路由协议（EIGRP/DUAL），将 Skills 视为网络节点，通过维护动态"路由表"实现自动发现与编排。

## 核心理念

```
传统方式：用户手动告诉 Agent "先用 Skill A，再用 Skill B"
Skill Router：维护路由表 → Agent 自动查表判断 → 用户确认后执行
```

## 安装

```bash
cd skill-router
npm install
npm link  # 全局安装 CLI
```

## 快速开始

```bash
# 1. 初始化：扫描所有已安装的 skills
skill-router init

# 2. 查看已注册的 skills
skill-router list

# 3. 安装新 skill（支持多种来源格式）
skill-router add <source>

# 4. 手动添加 skill（指定本地路径）

# 添加单个 skill
skill-router add-path /path/to/my-skill/SKILL.md
skill-router add-path /path/to/my-skill/

# 递归添加目录下所有 skills
skill-router add-path /path/to/skills-folder --all
skill-router add-path .agent/skills/baoyu-skills/skills -a

# 5. 导出路由表（用于 Agent 上下文）
skill-router export --brief  # 精简版，节省 token
skill-router export          # 完整版
```

## Source Formats（支持的来源格式）

`skill-router add` 支持 Vercel add-skill 的所有来源格式：

```bash
# 简单的 skill 名称
skill-router add three-writers-council

# GitHub shorthand
skill-router add vercel-labs/agent-skills

# Full GitHub URL
skill-router add https://github.com/vercel-labs/agent-skills

# Direct path to a skill in a repo
skill-router add https://github.com/vercel-labs/agent-skills/tree/main/skills/frontend-design

# GitLab URL
skill-router add https://gitlab.com/org/repo

# Any git URL
skill-router add git@github.com:vercel-labs/agent-skills.git

# 指定 skill 名称（当仓库有多个 skills 时）
skill-router add vercel-labs/agent-skills --skill vercel-react-best-practices

# 原始命令模式（用于特殊情况）
skill-router add --raw "npx add-skill vercel-labs/agent-skills --skill my-skill"
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `init` | 初始化，扫描标准路径下的 skills |
| `refresh` | 刷新，重新扫描并更新 registry |
| `add <name>` | 通过 npx add-skill 安装并注册 |
| `add-path <path>` | 手动添加（指定 SKILL.md 或目录） |
| `add-path <dir> --all` | 递归添加目录下所有 skills |
| `remove <id>` | 移除某个 skill |
| `list` / `ls` | 列出所有已注册 skills |
| `show <id>` | 查看某个 skill 详情 |
| `validate` | 检查 registry 中的路径是否有效 |
| `export` | 导出路由表（Markdown 或 JSON） |
| `export --brief` | 导出精简版路由表（节省 token） |
| `set-brief <id> <brief>` | 设置 skill 的一句话简介 |

## 选项

大多数命令支持以下选项：

- `-p, --project`：使用项目级 registry（`.skill-router/registry.json`）
- `-v, --verbose`：显示详细信息

## 探测路径

Skill Router 会在以下路径中搜索 skills（参考 Vercel add-skill 官方清单）：

```
.                          # 根目录（如果包含 SKILL.md）
skills/
skills/.curated/
skills/.experimental/
skills/.system/
.agents/skills/
.agent/skills/
.claude/skills/
.cline/skills/
.codex/skills/
.commandcode/skills/
.cursor/skills/
.factory/skills/
.gemini/skills/
.github/skills/
.goose/skills/
.kilocode/skills/
.kiro/skills/
.opencode/skills/
.openhands/skills/
.pi/skills/
.qoder/skills/
.roo/skills/
.trae/skills/
.windsurf/skills/
.zencoder/skills/
.neovate/skills/
```

全局搜索路径：
```
~/.cursor/skills/
~/.skills/
~/skills/
```

## Registry 结构

```json
{
  "version": "1.0",
  "created_at": "2026-01-23T10:00:00Z",
  "updated_at": "2026-01-23T12:00:00Z",
  "skills": [
    {
      "id": "three-writers-council",
      "name": "Three Writers Council",
      "description": "将素材迭代成高质量中文长文",
      "path": ".cursor/skills/three-writers-council",
      "manifest": ".cursor/skills/three-writers-council/SKILL.md",
      "source": "npx",
      "inputs": ["素材/草稿", "目标读者"],
      "outputs": ["公众号长文", "可拆分内容"],
      "tags": ["writing", "chinese"],
      "version": "1.0.0",
      "registered_at": "2026-01-23T10:00:00Z"
    }
  ]
}
```

## 两阶段加载（节省 Token）

当 skills 数量较多时，把完整路由表塞进 Agent 上下文会消耗大量 token。推荐使用**两阶段加载**：

### 第一阶段：精简清单

```bash
skill-router export --brief
```

输出：
```
| ID | 名称 | 简介 |
|----|------|------|
| humanizer-zh | humanizer-zh | 去除文本中的 AI 生成痕迹 |
| three-writers-council | three-writers-council | 三人议会协作打磨公众号长文 |
...
```

100 个 skills 也只需要 3000-5000 tokens。

### 第二阶段：按需加载

Agent 选中某个 skill 后，再读取完整的 SKILL.md：

```
Agent: "看起来你需要 humanizer-zh，让我读取它的详细说明..."
       → Read ~/.skill-router/skills/humanizer-zh/SKILL.md
```

### 自定义 brief

如果自动生成的简介不够好，可以手动设置：

```bash
skill-router set-brief three-writers-council "三人议会协作打磨公众号长文"
```

## 与 Cursor Rule 配合使用

导出精简版路由表，在 Cursor Rule 中使用两阶段加载：

```markdown
# Skill Router Integration

当用户发出任务指令时，先检查是否需要调用已安装的 skills。

## 当前可用 Skills（精简版）

<从 skill-router export --brief 的输出粘贴到这里>

## 判断流程

1. 根据精简清单，判断是否有匹配的 skill
2. 如果有，先读取该 skill 的完整 SKILL.md
3. 按照 SKILL.md 中的流程执行
4. 执行前询问用户确认
```

## 开发

```bash
# 运行开发版本
node bin/skill-router.js init

# 查看帮助
node bin/skill-router.js --help
```

## 设计理念

### 为什么不需要复杂的协议？

1. **LLM 是"软路由器"**：它能看懂描述、理解意图、做出判断，不需要预先计算匹配规则
2. **SKILL.md 已是"静态 Hello 包"**：描述、输入、输出都有，不需要额外的广播协议
3. **安装是低频操作**：不需要实时监听，安装时注册一次就够
4. **Human-in-the-loop**：让用户确认，自然形成安全阀

### EIGRP 思想的简化实现

| EIGRP 概念 | 本工具实现 |
|-----------|-----------|
| Hello 包 | SKILL.md（静态自描述） |
| 邻居发现 | 目录扫描 |
| 拓扑表 | registry.json |
| DUAL 算法 | LLM 判断 |
| Metric | 可在 registry 中扩展 |

## License

MIT
