
## Rules

* Always use the **sequential thinking** tool for reasoning and execution

### Obsidian API Documentation Access

* Use Context7 MCP for real-time Obsidian API docs:
  ```typescript
  mcp__upstash-context-7-mcp__get-library-docs("/obsidianmd/obsidian-api", 5000, "Plugin Development")
  mcp__upstash-context-7-mcp__get-library-docs("/obsidianmd/obsidian-developer-docs", 10000, "Complete Guide")
  ```
* Common Obsidian API patterns:
  * Register events: `this.registerEvent(app.on('event-name', callback))`
  * Process frontmatter: `app.fileManager.processFrontMatter(file, (fm) => {...})`
  * Get active editor: `app.workspace.activeEditor`
  * Register DOM: `this.registerDomEvent(element, 'click', callback)`
  * Register interval: `this.registerInterval(setInterval(callback, 1000))`

## Code Style

* Comments in English only
* Prefer functional programming over OOP
* Use separate OOP classes only for connectors and interfaces to external systems
* Write all other logic with pure functions (clear input/output, no hidden state changes)
* Functions must ONLY modify their return values - never modify input parameters, global state, or any data not explicitly returned
* Make minimal, focused changes
* Follow DRY, KISS, and YAGNI principles
* Use strict typing (function returns, variables) in all languages
* Use named parameters in function calls when possible
* No duplicate code; check if some logic is already written before writing it
* Avoid unnecessary wrapper functions without clear purpose
* Prefer strongly-typed collections over generic ones when dealing with complex data structures
* Consider creating proper type definitions for non-trivial data structures
* Native types are fine for simple data structures, but use proper models for complex ones
* Try to avoid using untyped variables and generic types where possible
* Never use default parameter values in function definitions - make all parameters explicit

## Error Handling

* Always raise errors explicitly, never silently ignore them
* If an error occurs in any logical part of code, raise it immediately and do not continue execution
* Use specific error types that clearly indicate what went wrong
* Avoid catch-all exception handlers that hide the root cause
* Error messages should be clear and actionable
* Log errors with appropriate context before raising them

## Code Changes

* You MUST respect existing code style and patterns if the user didn't specify otherwise
* You MUST suggest only minimal changes related to current user dialog
* You MUST change as few lines as possible while solving the problem
* You MUST focus only on what the user is asking for in the current dialog, no extra improvements
* You MUST understand the existing codebase before suggesting changes
* You MUST start with reading related files and codebase before suggesting changes
## Command

* release

  * Check the current version in `package.json`
  * Run `sh script/update-version.sh` to bump the version
  * Follow Semantic Versioning (SemVer):

    * PATCH → Increment for backward-compatible bug fixes
    * MINOR → Increment for backward-compatible new features
    * MAJOR → Increment for backward-incompatible API changes

## TypeScript Specifics

* Prefer interfaces over type aliases for complex object shapes
* Use typed objects for complex state management
* Throw Error objects with clear, descriptive messages (`throw new Error('Specific message')`)
* Apply discriminated unions for complex type scenarios

## Libraries and Dependencies

* Install dependencies in virtual environments, not globally
* Add dependencies to project configuration, not as one-off installs
* Explore source code when learning libraries
* Prefer project-level dependency management over individual package installs

  * Good: `pip install -r requirements.txt`
  * Better: use `pyproject.toml` with modern Python packaging
* When adding dependencies, always update the project configuration file, not just the environment

## Planning Practices

* A feature implementation plan can be requested
* You must:

  * Create a temporary directory
  * Create a markdown file with the feature plan in that directory
* The feature plan file must include:

  * Overview of the current state related to the feature
  * Overview of the final state of the feature
  * List of all files to be changed, with text descriptions of changes (not code)
  * A checklist of all tasks in two-level markdown checkbox style
* The plan must stay minimal, describing only the most important changes
* Additional ideas may be listed in a separate section, but should not be implemented unless explicitly requested
