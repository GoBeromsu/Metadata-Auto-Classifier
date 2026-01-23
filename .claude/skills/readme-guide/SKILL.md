---
name: readme-guide
description: Guide for writing effective README files for projects. Use this skill when creating or updating a project README, when the user asks to write documentation for a project, or when starting a new project that needs documentation.
---

# README Guide

## Overview

This skill helps create professional, well-structured README files that enable developers to quickly understand and use a project. It provides templates, guidelines, and a systematic workflow for README creation.

## When to Use This Skill

- Creating a new README for a project
- Updating an outdated README
- User requests README documentation
- Starting a new project that needs documentation
- Reviewing README completeness

## Workflow

### Step 1: Analyze the Project

Before writing, gather essential information:

1. **Identify project type**: Library, CLI tool, web app, API, etc.
2. **Check existing files**: `package.json`, `pyproject.toml`, `Cargo.toml`, etc.
3. **Review project structure**: Understand directory layout
4. **Find setup requirements**: Dependencies, environment variables, database

### Step 2: Check Required Sections

Every README must include these sections:

| Section | Purpose | Priority |
|---------|---------|----------|
| Quick Start | Enable immediate setup and running | Required |
| Tech Stack | List technologies used | Required |
| Project Structure | Explain directory layout | Required |

### Step 3: Add Recommended Sections

Consider adding these based on project needs:

| Section | When to Include |
|---------|-----------------|
| Title & Description | Always (1-2 sentences explaining the project) |
| Features | When project has distinct capabilities |
| Usage Examples | For libraries or CLI tools |
| Contributing | For open source projects |
| License | For public repositories |

### Step 4: Write and Validate

1. Use the template from `references/readme-template.md`
2. Fill in project-specific information
3. Validate against checklist below

## Section Guidelines

### Quick Start

**Goal**: Get users running the project in under 5 minutes.

**Must include**:
- Prerequisites (Node version, Python version, etc.)
- Installation commands
- Environment setup (if needed)
- Run commands for development

**Example structure**:
```markdown
## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
\`\`\`bash
npm install
\`\`\`

### Running
\`\`\`bash
npm start
\`\`\`
```

### Tech Stack

**Goal**: Quickly communicate what technologies are used.

**Best practices**:
- Group by category (Backend, Frontend, Database, etc.)
- Include version numbers for major dependencies
- Keep it scannable (table or bulleted list)

**Example structure**:
```markdown
## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript 5 |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 15 |
| Styling | Tailwind CSS 3 |
```

### Project Structure

**Goal**: Help developers navigate the codebase.

**Best practices**:
- Use tree format with clear indentation
- Add brief descriptions for each directory
- Focus on top-level structure (avoid excessive depth)
- Highlight key files

**Example structure**:
```markdown
## Project Structure

\`\`\`
project/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route pages
│   ├── services/      # API client
│   └── utils/         # Helper functions
├── tests/             # Test files
└── docs/              # Documentation
\`\`\`
```

## Checklist

Before finalizing, verify:

### Required Sections
- [ ] Quick Start section with installation and run commands
- [ ] Tech Stack section listing main technologies
- [ ] Project Structure with directory tree

### Quality Checks
- [ ] Commands are copy-paste ready
- [ ] No placeholder text remaining
- [ ] Paths and URLs are correct
- [ ] Version numbers are current

## Resources

### references/
- `readme-template.md` - Copy-paste template with all sections

