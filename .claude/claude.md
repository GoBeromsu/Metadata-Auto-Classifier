
## Rules

* Always use the **sequential thinking** tool for reasoning and execution

## Command

* **release**:
  * Check the current version in `package.json`
  * Run `sh script/update-version.sh` to bump the version
  * Versioning follows **Semantic Versioning (SemVer)**:
    * **PATCH** → Increment when applying backward-compatible bug fixes
    * **MINOR** → Increment when adding new functionality in a backward-compatible manner
    * **MAJOR** → Increment when making backward-incompatible API changes