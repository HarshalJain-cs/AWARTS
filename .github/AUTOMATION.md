# 🤖 GitHub Automation Guide

This document explains all the automated workflows in the AWARTS repository.

## 📋 Table of Contents

- [CI/CD Workflows](#cicd-workflows)
- [Auto-labeling](#auto-labeling)
- [Security Scanning](#security-scanning)
- [Dependency Management](#dependency-management)
- [Community Management](#community-management)
- [How to Use Labels](#how-to-use-labels)

---

## 🔄 CI/CD Workflows

### 1. **CI Workflow** (`.github/workflows/ci.yml`)

**Triggers:** Every push to `main`, every PR

**What it does:**
- ✅ Tests web app (lint, type-check, tests, build)
- ✅ Tests CLI on multiple OS (Ubuntu, Windows, macOS)
- ✅ Tests multiple Node.js versions (18, 20)
- ✅ Runs security audits
- ✅ Checks for secrets in code

**Status:** Required to pass before merge

### 2. **PR Validation** (`.github/workflows/pr-validation.yml`)

**Triggers:** When PR is opened/updated

**What it does:**
- ✅ Validates PR title follows conventional commits
- ✅ Checks for large files (>1MB)
- ✅ Detects sensitive files (.env, keys, etc.)
- ✅ Validates package.json syntax
- ✅ Checks for merge conflicts
- 💬 Posts helpful checklist comment

**Example PR titles:**
- ✅ `feat: add dark mode toggle`
- ✅ `fix: resolve login timeout issue`
- ✅ `docs: update installation guide`
- ❌ `Added new feature` (must use conventional commits)
- ❌ `Fix Bug` (subject must be lowercase)

---

## 🏷️ Auto-labeling

### **Automatic Labels** (`.github/workflows/labeler.yml`)

**What it does:**
- 🏷️ Labels PRs based on files changed
- 📏 Adds size labels (XS/S/M/L/XL)
- 🔖 Labels new issues as `needs-triage`

**Label Examples:**
- Changed `cli/**/*` → `cli` label
- Changed `src/**/*` → `web` label
- Changed `*.md` → `documentation` label
- Changed `package.json` → `dependencies` label
- PR with 25 lines → `size/S` label
- PR with 450 lines → `size/L` label

### **How to Import Labels**

Run this command to create all labels in your repo:

```bash
# First, install GitHub CLI if you haven't
gh label create -f .github/labels.yml
```

---

## 🔒 Security Scanning

### **CodeQL Analysis** (`.github/workflows/codeql.yml`)

**Triggers:**
- Every push to `main`
- Every PR
- Weekly on Mondays at 6 AM UTC

**What it does:**
- 🔍 Scans JavaScript and TypeScript code
- 🛡️ Detects security vulnerabilities
- 📊 Reports in GitHub Security tab

**View results:** Go to **Security** tab → **Code scanning alerts**

---

## 📦 Dependency Management

### **Dependabot** (`.github/dependabot.yml`)

**What it does:**
- 📅 Weekly dependency updates (Mondays at 9 AM)
- 🔄 Separate updates for web app and CLI
- 📦 Groups related updates (e.g., all @radix-ui packages)
- 🏷️ Auto-labels with `dependencies`

**Configuration:**
- Web app: Max 5 PRs/week
- CLI: Max 3 PRs/week
- GitHub Actions: Monthly updates

**Merge strategy:**
1. Dependabot opens PR
2. CI runs automatically
3. If CI passes + minor/patch update → safe to merge
4. If major update → review breaking changes first

---

## 👥 Community Management

### **Welcome Messages** (`.github/workflows/greetings.yml`)

**Triggers:** First-time issue or PR from contributor

**What it does:**
- 👋 Welcomes first-time contributors
- 📖 Links to contributing guide
- ✅ Explains what happens next
- 🎉 Encourages community participation

### **Stale Issue/PR Management** (`.github/workflows/stale.yml`)

**What it does:**
- 📌 Marks inactive issues/PRs as stale
- 🔒 Auto-closes after additional time
- ⏰ Issues: 60 days inactive → stale → 7 days → close
- ⏰ PRs: 30 days inactive → stale → 14 days → close

**Exempt labels:** `pinned`, `security`, `in-progress`, `help-wanted`

**To prevent closing:** Just add a comment!

---

## 🏷️ How to Use Labels

### **For Maintainers:**

#### Triage new issues:
1. Issue opens → auto-labeled `needs-triage`
2. Review issue
3. Add priority: `priority: high/medium/low`
4. Add type: `bug`, `enhancement`, `documentation`
5. Remove `needs-triage`

#### Manage PRs:
1. PR opens → auto-labeled with component + size
2. Add `waiting-for-review` when ready
3. Add `in-progress` if needs changes
4. Add `pinned` for important PRs (won't go stale)

### **For Contributors:**

You don't need to add labels! They're added automatically:
- 🤖 Component labels (cli, web, docs) based on files
- 📏 Size labels based on lines changed
- 🏷️ Type labels from PR title (feat, fix, etc.)

---

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/HarshalJain-cs/AWARTS/workflows/CI/badge.svg)](https://github.com/HarshalJain-cs/AWARTS/actions/workflows/ci.yml)
[![CodeQL](https://github.com/HarshalJain-cs/AWARTS/workflows/CodeQL%20Security%20Scan/badge.svg)](https://github.com/HarshalJain-cs/AWARTS/actions/workflows/codeql.yml)
```

---

## 🚀 Quick Commands

```bash
# View all workflows
gh workflow list

# Manually trigger a workflow
gh workflow run ci.yml

# View recent workflow runs
gh run list

# View specific run logs
gh run view <run-id>

# Import labels
gh label create -f .github/labels.yml

# Enable Dependabot alerts
gh api repos/HarshalJain-cs/AWARTS/vulnerability-alerts -X PUT
```

---

## 🛠️ Troubleshooting

### CI is failing
1. Check the workflow run: `gh run view --log-failed`
2. Common issues:
   - Linting errors → Run `npm run lint` locally
   - Type errors → Run `npx tsc --noEmit`
   - Test failures → Run `npm test`
   - Build errors → Run `npm run build`

### Dependabot PRs not appearing
1. Ensure Dependabot is enabled in repo settings
2. Check `.github/dependabot.yml` syntax
3. View Dependabot logs in **Insights** → **Dependency graph**

### Labels not auto-applying
1. Check `.github/labeler.yml` syntax
2. Ensure PR has changed files matching patterns
3. Verify workflow has `pull-requests: write` permission

---

## 📞 Need Help?

- 📖 [GitHub Actions Docs](https://docs.github.com/en/actions)
- 💬 [Open a Discussion](https://github.com/HarshalJain-cs/AWARTS/discussions)
- 🐛 [Report an Issue](https://github.com/HarshalJain-cs/AWARTS/issues/new/choose)

---

**Last Updated:** May 2026
