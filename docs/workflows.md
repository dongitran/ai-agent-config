# Workflows Documentation

AI Agent Config includes powerful workflows that guide AI assistants through complex tasks with structured, step-by-step processes.

## Available Workflows

| Workflow | Command | Description |
|----------|---------|-------------|
| **Brainstorm** | `/workflow brainstorm` | Creative problem-solving and ideation |
| **Create PR** | `/workflow create-pr` | GitHub Pull Request creation |
| **Update Skills** | `/workflow update-skills` | Sync latest skills from repository |

---

## 🧠 Brainstorm Workflow

A comprehensive 6-phase workflow for creative problem-solving based on the Osborn-Parnes Creative Problem Solving model.

### Phases

| Phase | Name | Goal | Time |
|-------|------|------|------|
| 0 | **Warm-up** | Activate creative thinking | 3-5 min |
| 1 | **Clarify** | Define problem deeply | 10-15 min |
| 2 | **Ideate** | Generate many ideas (diverge) | 20-30 min |
| 3 | **Evaluate** | Analyze and prioritize (converge) | 15-20 min |
| 4 | **Visualize** | Diagram solution | 10-15 min |
| 5 | **Decide** | Document decision & next steps | 10-15 min |

### Included Techniques (20+)

**Clarify Phase:**
- Problem Statement
- Starbursting (6W)
- The 5 Whys
- Gap Analysis
- SWOT Analysis

**Ideate Phase (Divergent):**
- Classic Brainstorm
- Mind Mapping
- Crazy Eights
- SCAMPER
- Reverse Brainstorming
- Cross-Domain Thinking
- Six Thinking Hats
- Rolestorming
- Brainwriting (6-3-5)

**Evaluate Phase (Convergent):**
- Affinity Grouping
- Prioritization Matrix (2x2)
- Evaluation Scoring
- MoSCoW Prioritization
- Trade-off Analysis

### Usage

```
/workflow brainstorm
```

Then describe your problem or topic to brainstorm.

---

## 🔀 Create PR Workflow

Streamlined workflow for creating GitHub Pull Requests using the `gh` CLI.

### Steps

1. Check current branch status
2. Push branch to origin
3. Create PR with title and body

### Usage

```
/workflow create-pr
```

### Options

- `--draft` - Create a draft PR
- `--fill` - Auto-fill title/body from commits

---

## 🔄 Update Skills Workflow

Sync and install the latest skills from the central repository.

### Steps

1. Sync from GitHub: `ai-agent sync`
2. Install with force: `ai-agent install --force`

### Usage

```
/workflow update-skills
```

### Prerequisites

- `ai-agent-config` npm package installed globally
- If not: `npm install -g ai-agent-config`

---

## Creating Custom Workflows

Workflows are Markdown files stored in `.agent/workflows/` directory.

### Basic Structure

```markdown
---
description: Short description of the workflow
---

# Workflow Name

// turbo-all

## Overview
[Brief overview of the workflow]

## Steps
[Step-by-step instructions]

## Notes
[Additional tips or requirements]
```

### Best Practices

- Use clear headings (`#`, `##`, `###`)
- Include tables for structured data
- Use code blocks for commands/templates
- Keep instructions concise but complete
- Add timing estimates when relevant

---

## Resources

- [GitHub Repository](https://github.com/dongitran/ai-agent-config)
- [NPM Package](https://www.npmjs.com/package/ai-agent-config)
