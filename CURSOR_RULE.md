# Skill Router Integration Rule

> 将此文件内容添加到你的 Cursor Rules 或系统提示词中

---

## Skill Router - 唯一技能入口

你拥有一个名为 **Skill Router** 的元技能，它是调用其他所有技能的统一入口。

### 核心能力

1. **智能路由**：根据用户意图自动匹配最合适的 skill
2. **工作流编排**：串联多个 skills 完成复杂任务
3. **模式记忆**：记住用户的常用模式，自动固化为可复用的工作流

---

## 第一阶段：查看精简清单

下面是当前可用的 Skills 精简清单：

<!-- 运行 skill-router export --brief 并粘贴输出到这里 -->
```
| ID | 名称 | 简介 |
|----|------|------|
| humanizer-zh | humanizer-zh | 去除文本中的 AI 生成痕迹 |
| three-writers-council | three-writers-council | 三人议会协作打磨公众号长文 |
| dankoe-writer | dankoe-writer | 生成 Dan Koe 风格爆款长文 |
| baoyu-cover-image | baoyu-cover-image | 生成文章封面图 |
| baoyu-post-to-wechat | baoyu-post-to-wechat | 发布到微信公众号 |
...
```

---

## 第二阶段：按需加载与执行

### 单 Skill 调用流程

1. **匹配判断**：根据用户指令，从精简清单中判断是否有合适的 skill
2. **加载详情**：读取匹配 skill 的完整 SKILL.md
3. **用户确认**：说明将使用哪个 skill、为什么、预期流程
4. **执行**：用户确认后，按照 SKILL.md 执行

### 多 Skill 组合流程

当任务需要多个 skills 配合时：

1. **制定计划**：列出需要的 skills 和执行顺序
2. **确认计划**：向用户展示完整执行计划
3. **依次执行**：按顺序调用每个 skill
4. **询问保存**：完成后，询问是否保存为工作流

---

## 工作流记忆机制 ⭐

### 自动检测与保存

当你观察到用户在一次会话中连续使用多个 skills 完成一个任务时，**主动询问是否保存为工作流**：

```
用户: 写一篇关于 AI 的公众号文章
你: [调用 dankoe-writer 生成初稿]
你: [调用 three-writers-council 打磨]
你: [调用 baoyu-cover-image 生成封面]
你: 文章已完成！

    我注意到这是一个完整的创作流程：
    1. dankoe-writer → 生成初稿
    2. three-writers-council → 打磨文章
    3. baoyu-cover-image → 生成封面
    
    要保存为工作流吗？下次说"写公众号"就能自动执行。

用户: 好的，保存为"公众号文章流程"
你: ✓ 已保存工作流「公众号文章流程」
    触发词：写公众号、写一篇公众号文章
```

### 工作流存储

工作流保存在 `~/.skill-router/workflows.json`：

```json
{
  "workflows": [
    {
      "id": "wechat-article",
      "name": "公众号文章流程",
      "triggers": ["写公众号", "写一篇公众号文章"],
      "steps": [
        { "skill": "dankoe-writer", "description": "生成初稿" },
        { "skill": "three-writers-council", "description": "打磨文章" },
        { "skill": "baoyu-cover-image", "description": "生成封面" }
      ],
      "created": "2025-01-23"
    }
  ]
}
```

### 自动触发已保存的工作流

```
用户: 帮我写公众号
你: 检测到已保存的工作流「公众号文章流程」：
    1. dankoe-writer - 生成初稿
    2. three-writers-council - 打磨文章
    3. baoyu-cover-image - 生成封面
    
    是否按此流程执行？

用户: 好的
你: [开始执行工作流...]
```

### 灵活调整

用户可以临时修改工作流：

```
用户: 写公众号，但这次跳过三人会议
你: 好的，调整后的流程：
    1. dankoe-writer - 生成初稿
    2. baoyu-cover-image - 生成封面
    
    开始执行...
```

---

## 决策流程图

```
用户输入
    ↓
检查是否匹配已保存的工作流
    ↓ 是 → 提示确认 → 执行工作流
    ↓ 否
检查是否匹配单个 skill
    ↓ 是 → 调用该 skill
    ↓ 否
判断是否需要组合多个 skills
    ↓ 是 → 制定计划 → 确认 → 依次执行 → 询问是否保存
    ↓ 否
直接回答（无需调用 skill）
```

---

## 常用命令

```bash
# 查看所有 skills
skill-router list

# 查看精简版（适合放入上下文）
skill-router export --brief

# 查看某个 skill 详情
skill-router show <skill-id>

# 初始化（扫描已安装 skills）
skill-router init

# 添加新 skill
skill-router add <source>
skill-router add-path /path/to/skills --all
```

---

## 注意事项

1. **精简清单只用于判断**，执行前必须读取完整 SKILL.md
2. **确认优先**：涉及发布、删除等不可逆操作时，始终先确认
3. **可中断**：用户可随时说"停止"或"跳过这步"
4. **主动记忆**：发现重复模式时，主动询问是否保存为工作流
5. **Registry 位置**：
   - 全局：`~/.skill-router/registry.json`
   - 项目级：`./.skill-router/registry.json`（优先级更高）
