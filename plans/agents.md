# Agent Guidelines for Plans Folder

> Quy tắc và best practices khi tạo các file plan trong folder `plans/`

---

## 📋 Purpose of Plans

Plans trong folder `plans/` là tài liệu **high-level strategy** để:
- Describe **what** needs to be done (objectives)
- Explain **why** we need this feature (background, motivation)
- Outline **how** to implement (architecture, phases)
- Define **success criteria** and testing strategy

Plans **KHÔNG phải** là:
- ❌ Code examples chi tiết
- ❌ Implementation tutorials
- ❌ Copy-paste ready code snippets

---

## ✅ What to Include

### 1. Objective & Background
- Mục tiêu của feature/change
- Context và lý do cần thiết
- Current state vs Target state

### 2. Design & Architecture
- High-level architecture diagram (text-based)
- Data structures và file formats (structure only, not code)
- Repository/folder structure
- Key concepts và terminology

### 3. Implementation Strategy
- Phân chia phases (Phase 1, 2, 3...)
- Files cần tạo mới
- Files cần modify
- Key functions/modules cần implement (tên function + mục đích, KHÔNG CẦN code)

### 4. Testing Strategy
- Unit test scope (test gì, KHÔNG CẦN code mẫu)
- Integration test checklist
- Manual verification steps

### 5. Success Criteria
- Danh sách checkboxes để verify feature hoàn thành
- Expected outcomes

### 6. Implementation Phases
- Phân chia thành các phases logic
- Checklist tasks cho mỗi phase
- **KHÔNG CẦN** ghi estimate time cho từng phase
- Dependencies giữa các phases (nếu có)

### 7. Open Questions
- Những câu hỏi chưa resolved
- Trade-offs cần discuss

---

## ❌ What NOT to Include

### 1. Code Examples
**DON'T:**
```javascript
// ❌ KHÔNG CẦN code như này trong plan
function validateMcpConfig(config) {
  const errors = [];
  if (!config.name) errors.push("Missing name");
  return { valid: errors.length === 0, errors };
}
```

**DO:**
- Function: `validateMcpConfig(config)`
- Purpose: Validate MCP server config structure
- Validates: name (required), command (required), args (array), env (object)

### 2. Detailed Implementation
**DON'T:**
- Step-by-step code walkthrough
- Line-by-line implementation guide
- Exact code snippets to copy

**DO:**
- "Create `mcp-manager.js` with discovery functions"
- "Add validation logic for required fields"
- "Integrate with `installer.js` by importing module and calling `installMcpServers()`"

### 3. Test Code Examples
**DON'T:**
```javascript
// ❌ KHÔNG CẦN test code mẫu
test("validateMcpConfig - valid config", () => {
  const config = { name: "test", command: "npx" };
  const result = validateMcpConfig(config);
  assert.strictEqual(result.valid, true);
});
```

**DO:**
- Test `validateMcpConfig()` với valid configs
- Test missing required fields
- Test invalid data types

### 4. Phase Duration Estimates
**DON'T:**
- Phase 1: Foundation (1-2 days)
- Phase 2: Implementation (2-3 days)
- Total: 5-8 days

**DO:**
- Phase 1: Foundation
- Phase 2: Implementation
- (Không cần estimate time)

---

## 📝 Plan Template

Use this structure for new plans:

```markdown
# Plan: [Feature Name]

> Brief description

**Version**: vX.Y.Z  
**Created**: YYYY-MM-DD  
**Status**: Planning/In Progress/Done

---

## 🎯 Objective
- Current state
- Target state
- Why we need this

## 🧠 Background
- Context
- Related concepts
- Links to docs

## 🏗️ Design
- Architecture
- Data structures (format only)
- File/folder structure

## 🔧 Implementation
### Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]
- [ ] Task 1

## ✅ Testing Strategy
- Unit tests scope
- Integration tests
- Manual verification

## 📦 Deliverables
- New files: ...
- Modified files: ...

## 🎯 Success Criteria
1. ✅ Criterion 1
2. ✅ Criterion 2

## 🤔 Open Questions
1. Question 1?
2. Question 2?

---

**Next Steps:**
1. ⏳ Step 1
2. ⏳ Step 2
```

---

## 🎯 Why This Matters

### Benefits của NO CODE in Plans:
1. **Concise** - Plans ngắn gọn, dễ đọc, dễ review
2. **Flexible** - Implementation details có thể thay đổi mà không cần update plan
3. **Focus** - Tập trung vào WHAT/WHY/HOW, không bị distract bởi code syntax
4. **Less maintenance** - Không cần update code examples khi refactor

### When to Write Code:
- ✅ Trong files implementation (`package/scripts/*.js`)
- ✅ Trong test files (`package/test/*.test.js`)
- ✅ Trong documentation (`README.md`, `AGENT.md`)
- ❌ **KHÔNG** trong plan files

---

## 📚 Examples

### Good Plan Example:
```markdown
## Phase 2: MCP Discovery

**Create `package/scripts/mcp-manager.js`:**

Functions:
- `getAvailableMcpServers()` - Scan `.agent/mcp-servers/` folders
- `validateMcpConfig(config)` - Validate name, command, args types
- `installMcpServers(platform, options)` - Install to mcp_config.json

Logic flow:
1. Read folders in mcp-servers directory
2. Parse config.json files
3. Filter by enabled and platform fields
4. Merge into existing mcp_config.json
```

### Bad Plan Example (TOO MUCH CODE):
```markdown
## Phase 2: MCP Discovery

**Create `package/scripts/mcp-manager.js`:**

```javascript
function getAvailableMcpServers() {
  if (!fs.existsSync(REPO_MCP_DIR)) return [];
  const servers = [];
  const entries = fs.readdirSync(REPO_MCP_DIR);
  // ... 50 lines of code ...
}

function validateMcpConfig(config) {
  // ... 30 lines of code ...
}
```
❌ This is TOO DETAILED for a plan!
```

---

## 🚀 Agent Instructions

When creating plans:
1. Focus on **strategy and architecture**
2. Describe **what functions do**, not how they're coded
3. Use **bullet points** instead of code blocks
4. Include **structure diagrams** (text-based, not code)
5. Keep it **concise and scannable**

Remember: **Plans are blueprints, not tutorials!**

---

**Created**: 2026-02-13
**Purpose**: Guide agents to write concise, high-level plans without excessive code examples
