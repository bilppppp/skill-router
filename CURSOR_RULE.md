# Skill Router Integration Rule

> 将此文件内容添加到你的 Cursor Rules 或系统提示词中

---

## Skill 路由规则（两阶段加载）

当用户发出任务指令时，使用**两阶段加载**判断是否需要调用已安装的 skills。

### 第一阶段：查看精简清单

下面是当前可用的 Skills 精简清单：

<!-- 运行 skill-router export --brief 并粘贴输出到这里 -->
```
| ID | 名称 | 简介 |
|----|------|------|
| humanizer-zh | humanizer-zh | 去除文本中的 AI 生成痕迹 |
| three-writers-council | three-writers-council | 三人议会协作打磨公众号长文 |
| dankoe-writer | dankoe-writer | 生成 Dan Koe 风格爆款长文 |
...
```

### 第二阶段：按需加载详情

1. **匹配判断**：根据用户指令，从精简清单中判断是否有合适的 skill
2. **加载详情**：如果找到匹配的 skill，使用 Read 工具读取其完整 SKILL.md
   - 通过 `skill-router show <id>` 可以查看 manifest 路径
   - 或直接读取 `~/.skill-router/registry.json` 获取 manifest 字段
3. **理解流程**：按照 SKILL.md 中的说明理解该 skill 的具体用法
4. **用户确认**：向用户说明将使用哪个 skill、为什么选择它、预期流程
5. **执行**：用户确认后，按照 SKILL.md 的流程执行

### 判断流程示例

```
用户："帮我把这篇文章改得更自然，去掉 AI 味"

Agent 思考：
1. 查看精简清单 → 发现 "humanizer-zh: 去除文本中的 AI 生成痕迹"
2. 这个 skill 匹配用户需求
3. 读取完整的 SKILL.md：Read ~/.../humanizer-zh/SKILL.md
4. 向用户确认："我发现有一个 humanizer-zh 技能可以帮你去除 AI 痕迹，是否使用？"
5. 用户确认后，按照 SKILL.md 的流程执行
```

### 多 Skill 组合示例

```
用户："帮我写一篇关于 AI Agent 的公众号文章"

Agent 思考：
1. 查看精简清单 → 发现多个写作相关 skill
2. 读取详情，判断最合适的组合
3. 向用户展示执行计划：

"根据你的需求，我建议使用以下流程：

1. **three-writers-council** - 三人议会协作打磨长文
   这个 skill 会通过三位虚拟编辑的评审和投票，迭代出高质量的公众号文章。

是否按此流程执行？"
```

### Registry 位置

- 全局：`~/.skill-router/registry.json`
- 项目级：`./.skill-router/registry.json`（优先级更高）

### 如果没有路由表

如果路由表文件不存在，提示用户：

```
检测到尚未初始化 Skill 路由表。
请运行以下命令扫描已安装的 skills：

skill-router init

或者手动添加 skill：

skill-router add-path /path/to/your/skill/SKILL.md
```

### 注意事项

- **精简清单只用于判断**，不要基于简介执行，必须先读取完整 SKILL.md
- 优先使用项目级 skills（如果存在）
- 不要在未经用户确认的情况下执行 skill
- 如果 skill 执行失败，提供错误信息并建议替代方案
