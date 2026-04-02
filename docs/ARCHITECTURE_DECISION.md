# Superpowers 分析：是否移除旧匹配规则

**日期：** 2026-03-31  
**问题：** 已实现严格触发模式，是否应该移除旧的宽松匹配规则？

---

## 📊 当前状态

### 文件结构
```
src/
├── keywords.ts          # 旧：宽松匹配（已废弃但未删除）
├── keywords-strict.ts   # 新：严格匹配（已启用）
└── ...
```

### index.ts 引用
```typescript
import { detectRelevantTools } from "./src/keywords-strict.js";  // ✅ 使用严格模式
```

---

## 🎯 分析维度

### 1. 技术债务

**保留旧文件的风险：**
| 风险 | 说明 | 影响 |
|------|------|------|
| **代码混淆** | 新开发者不知道用哪个 | ⚠️ 中 |
| **维护成本** | 需要维护两份代码 | ⚠️ 低 |
| **意外使用** | 可能有人误引用旧文件 | ⚠️ 低 |
| **仓库大小** | 增加几 KB | ✅ 可忽略 |

**删除旧文件的风险：**
| 风险 | 说明 | 影响 |
|------|------|------|
| **回滚困难** | 需要 git 恢复 | ⚠️ 低 |
| **对比困难** | 无法直接 diff | ⚠️ 低 |

---

### 2. 使用场景分析

**旧匹配规则（keywords.ts）：**
```typescript
// 宽松匹配
"分析贵州茅台" → 触发 stock_analysis
"看看茅台走势" → 触发 stock_analysis
```

**新匹配规则（keywords-strict.ts）：**
```typescript
// 严格匹配
"用 DSA 分析贵州茅台" → 触发 stock_analysis
"分析贵州茅台" → 不触发
```

**是否有同时需要两种模式的场景？**

❌ **没有！** 

原因：
1. **设计目标冲突** - 宽松 vs 严格，不能共存
2. **用户期望明确** - 要么自动触发，要么明确指定
3. **Superpowers 优先级** - 代码任务应该由 Superpowers 处理

---

### 3. 最佳实践

根据 Superpowers 的 `finishing-a-development-branch` 技能：

**完成功能后应该：**
1. ✅ 删除废弃代码
2. ✅ 清理临时文件
3. ✅ 更新文档
4. ✅ 确保只有一个实现

**理由：**
> "Code that is no longer used should be removed, not commented out or kept around 'just in case'. That's what version control is for."

---

### 4. 决策矩阵

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **A. 删除旧文件** | ✅ 代码清晰<br>✅ 无维护负担<br>✅ 符合最佳实践 | ❌ 需要 git 才能恢复 | ⭐⭐⭐⭐⭐ |
| **B. 保留但注释** | ✅ 可以随时恢复 | ❌ 代码混淆<br>❌ 技术债务 | ⭐⭐ |
| **C. 保留不处理** | ✅ 无改动 | ❌ 代码混乱<br>❌ 维护负担 | ⭐ |

---

## 💡 推荐方案

### 🏆 方案 A：删除旧文件

**理由：**
1. ✅ **设计决策已明确** - 严格触发模式更好
2. ✅ **Git 已保存历史** - 随时可以恢复
3. ✅ **符合最佳实践** - 删除废弃代码
4. ✅ **减少混淆** - 只有一个实现
5. ✅ **降低维护成本** - 无需维护两份代码

**实施步骤：**
```bash
# 1. 确认当前使用的是严格模式
grep "keywords-strict" index.ts  # ✅ 已确认

# 2. 删除旧文件
rm src/keywords.ts

# 3. 提交
git add -A
git commit -m "refactor: Remove deprecated loose matching keywords

Now using strict trigger mode (keywords-strict.ts).
Old keywords.ts is no longer needed and can be restored
from git history if necessary.

Refs: #123 (strict trigger mode implementation)"

# 4. 更新文档说明触发规则
```

---

## 🔍 反方观点分析

### 论点：保留旧文件作为"备份"

**反驳：**
1. ❌ **Git 就是备份** - `git log -- src/keywords.ts` 随时查看
2. ❌ **不会回退** - 严格模式是明确的改进方向
3. ❌ **增加混乱** - 新开发者不知道用哪个

### 论点：可能有人喜欢宽松模式

**反驳：**
1. ❌ **设计决策已明确** - 严格模式避免冲突
2. ❌ **可以配置** - 未来可以通过配置支持两种模式
3. ❌ **当前无需求** - 没有用户反馈需要宽松模式

---

## 📋 最终建议

### ✅ 删除旧文件（keywords.ts）

**原因：**
1. **设计决策明确** - 严格触发模式更好
2. **Git 保存历史** - 不需要文件作为备份
3. **符合最佳实践** - 删除废弃代码
4. **减少技术债务** - 避免混淆和维护负担

### 📝 同时更新文档

在 README 中添加：

```markdown
## Trigger Mode

**Strict Mode** (v1.1+)

DSA tools only trigger when you explicitly mention DSA:

✅ "用 DSA 分析贵州茅台"
✅ "DSA 分析茅台"
❌ "分析贵州茅台" (won't trigger)

This avoids conflicts with Superpowers skills.
```

---

## 🚀 实施计划

### Step 1: 确认使用情况
```bash
grep -r "keywords\.ts" src/  # 确认无引用
```

### Step 2: 删除文件
```bash
rm src/keywords.ts
```

### Step 3: 提交
```bash
git add -A
git commit -m "refactor: Remove deprecated loose matching keywords"
```

### Step 4: 更新文档
```bash
# 更新 README.md
# 更新 CHANGELOG.md
```

---

## ✅ 结论

**删除旧文件（keywords.ts）是最佳选择！**

**理由：**
- ✅ 设计决策明确
- ✅ Git 保存历史
- ✅ 符合最佳实践
- ✅ 减少技术债务

**风险：** 低（Git 可随时恢复）

**推荐度：** ⭐⭐⭐⭐⭐
