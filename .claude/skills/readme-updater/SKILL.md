---
name: readme-updater
description: Keeps a project's README.md accurate and up-to-date by analyzing git history, exploring the codebase, and rewriting stale sections. Works with any language or framework. Trigger this skill whenever the user says things like "update my readme", "my readme is outdated", "sync readme with code", "refresh documentation", "readme is wrong", "document recent changes", or any variation of wanting the README to reflect the current state of the project. Also trigger when the user has just shipped a batch of features and asks "what should I document?" or "is my readme still accurate?". Always use this skill over ad-hoc file editing — it produces a structured diff review before touching anything.
---

# README Updater

Analyze a project's git history and codebase, then produce an accurate, up-to-date README — showing the user a clear diff before writing anything.

Works with any language or framework. All discovery steps are generic.

---

## Workflow

### Step 1 — Orient

Locate the README and confirm the project root:

```bash
find . -maxdepth 2 -iname "readme*" | head -5
git rev-parse --show-toplevel
```

Read the current README in full. Note:

- Sections that exist and their stated purpose
- Stack / tech claims (languages, frameworks, versions)
- Setup / install instructions
- Any badges, links, or screenshots

---

### Step 2 — Pull Git History Since Last README Update

```bash
LAST_README_COMMIT=$(git log -1 --format="%H" -- README.md)
git log ${LAST_README_COMMIT}..HEAD --no-merges --oneline
git log ${LAST_README_COMMIT}..HEAD --no-merges --format="----%n%H%n%s%n%b"
```

Group commits into:

- **Features** — new capabilities
- **Fixes** — bugs resolved
- **Breaking changes** — API / config / behaviour changes
- **Dependencies** — packages added, removed, or upgraded
- **Infrastructure** — CI/CD, containers, deployment
- **Refactors** — internal-only, no user impact

> If there are no commits since the last README update, report that and stop.

---

### Step 3 — Discover Project Structure

All steps are language-agnostic. Run each; skip silently if the file/tool is absent.

#### 3a. Detect language and tooling

```bash
ls -1 \
  package.json composer.json Gemfile go.mod Cargo.toml \
  pyproject.toml setup.py requirements.txt pom.xml build.gradle \
  mix.exs pubspec.yaml 2>/dev/null
```

Read whichever manifest files are present and extract:

- Runtime / language version
- Direct dependencies and their versions
- Defined scripts / tasks / commands

#### 3b. Environment variables

```bash
# Find env example files
find . -maxdepth 2 -name ".env*" | grep -iE "example|sample|template" | head -5

# Scan source for env references across common languages
grep -rh \
  -e 'os\.environ' -e 'process\.env\.' -e 'ENV\[' \
  -e 'getenv(' -e 'env(' -e 'System\.getenv' \
  --include="*.py" --include="*.js" --include="*.ts" \
  --include="*.rb" --include="*.go" --include="*.php" \
  --include="*.java" --include="*.kt" --include="*.ex" \
  . 2>/dev/null \
  | grep -oP "[A-Z][A-Z0-9_]{2,}" | sort -u | head -60
```

#### 3c. CLI entry points and scripts

```bash
# Check all common task runners — use whichever exist
cat package.json    2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,v) for k,v in d.get('scripts',{}).items()]"
cat composer.json   2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(k,v) for k,v in d.get('scripts',{}).items()]"
grep -E '^[a-zA-Z_-]+:' Makefile 2>/dev/null | head -30
grep -A2 '\[tool\.poetry\.scripts\]' pyproject.toml 2>/dev/null
grep -A2 '\[\[bin\]\]' Cargo.toml 2>/dev/null
```

#### 3d. Container and infrastructure

```bash
cat docker-compose.yml 2>/dev/null || cat docker-compose.yaml 2>/dev/null
grep -E '^(FROM|EXPOSE|ENTRYPOINT|CMD|ENV)' Dockerfile 2>/dev/null
ls .github/workflows/ kubernetes/ helm/ terraform/ infra/ 2>/dev/null
```

#### 3e. Directory structure

```bash
find . -maxdepth 2 \
  -not -path '*/.git/*' \
  -not -path '*/vendor/*' \
  -not -path '*/node_modules/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/target/*' \
  -not -path '*/.gradle/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/.cache/*' \
  | sort | head -60
```

#### 3f. Infer project type

Use discovered files to identify what kind of project this is (CLI tool, web API, library, monorepo, mobile app, etc.) and use that to judge which README sections are relevant.

---

### Step 4 — Build the Change Report

```
## README Change Report

### ✅ Still accurate
- <sections that need no changes>

### ⚠️ Needs update
| Section | Current content | What changed | Recommended update |
|---------|----------------|--------------|-------------------|

### ➕ Missing (not documented yet)
- <new features, commands, env vars found in code but absent from README>

### 🗑️ Stale (no longer applies)
- <sections referencing removed files, commands, or behaviour>

### 📦 Dependency changes
- Added / Removed / Upgraded: ...
```

**Detect execution mode:**

- **`CI` env var set** → CI mode: print report, proceed without confirmation.
- **No `CI` env var** → Interactive: show report, wait for user confirmation.

---

### Step 5 — Write the Updated README

In **interactive mode**: proceed only after the user confirms.
In **CI mode**: proceed immediately.

#### Rules for writing

- **Preserve structure** — keep existing section order and headings.
- **Don't fabricate** — only document what was found in code or commits. When unsure, add `<!-- TODO: verify -->`.
- **Match the tone** — formal, casual, emoji-heavy — whatever the original uses.
- **Badges** — update version badges only if a version change was confirmed; never invent new ones.
- **Screenshots** — never add or remove; flag in the report if they look outdated.
- **Changelog section** — if one exists, prepend new entries; never rewrite history.
- **Stay neutral** — describe behaviour and interfaces; avoid internal implementation details specific to any framework.

---

### Step 6 — Final Output

**Interactive**: show `git diff README.md`, ask for confirmation, then optionally commit.

**CI**: push to a new branch and open a PR — never commit directly to the default branch.

```bash
BRANCH="readme-updater/$(date +%Y%m%d-%H%M%S)"
git checkout -b "$BRANCH"
git add README.md
git commit -m "docs: update README to reflect changes since ${LAST_README_COMMIT:0:7}"
git push origin "$BRANCH"

gh pr create \
  --title "docs: update README ($(date +%Y-%m-%d))" \
  --body "Auto-generated by readme-updater." \
  --base main --head "$BRANCH" --label documentation 2>/dev/null || true
```

---

## Edge Cases

| Situation                  | How to handle                                         |
| -------------------------- | ----------------------------------------------------- |
| No git history             | Skip Step 2; do a full codebase scan                  |
| Monorepo                   | Ask which package's README to update                  |
| README > 500 lines         | Process section by section; ask which to prioritise   |
| No README exists           | Offer to generate one from codebase scan              |
| README updated today       | Report "appears current" and stop unless user insists |
| Unknown language / tooling | Rely on directory structure and commit messages       |

---

## Quality Checklist

- [ ] All version numbers match manifest files
- [ ] All env vars in example files are documented
- [ ] Install / setup steps are runnable top-to-bottom
- [ ] No references to deleted files or removed commands
- [ ] New features from commits are mentioned
- [ ] Container / infra changes are reflected
- [ ] No invented facts — everything traceable to code or commits
