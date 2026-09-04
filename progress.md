# Progress Log: webconfig Implementation

## Session 2026-09-04 - Planning Phase

### Started
- Created task_plan.md with 7 phases per specification
- Created findings.md with detailed specification analysis
- Created progress.md (this file)

### Specification Review Complete
- All 24 error codes cataloged
- Format structure understood (6 manifest keys, 8 site.config keys)
- Canonicalization recipe clear
- CLI commands behavior specified
- Golden fixture requirements defined
- Stack locked (no extra deps allowed)

### Rectifications Applied (from user)
1. Phase 2 ends with well-formed golden (parseable, structure present) — validation is Phase 4 checkpoint
2. 5 frozen answers added to CHANGELOG.md "Decisiones congeladas" (documented in task_plan.md)
3. Phase 1 additions: exact dependency versions (no ^), package-lock.json committed, .npmrc (engine-strict=true), .nvmrc ("20"), DECISIONS.md with header
4. validate CLI adds `--json` flag (outputs {errors, warnings} for pipeline)
5. Integration tests via execFile of compiled binary (validate, export)
6. ds-catalog: mandatory `category` per component (layout|nav|content|form|media); layout detection via this field
7. package.json: `"private": true` unless user says otherwise

### Corrections Applied (A & B)
| Correction | Old | New |
|------------|-----|-----|
| **ICON_001 emoji** | `/\p{Emoji}/u` + whitelist | Primary = whitelist from DS catalog; Secondary = `/\p{Extended_Pictographic}/u` (NOT `\p{Emoji}` — matches digits, #, *) |
| **SECRET_001/CRYPTO_001** | Flat keyword list | Data-driven array `{pattern, code, severity}` with exact frozen regexes: **SECRET_001 (error)**: `AKIA[0-9A-Z]{16}`, `(sk\|pk)-[A-Za-z0-9]{20,}`, `ghp_\|gho_[A-Za-z0-9]{36}`, `github_pat_`, `xox[abprs]-`, `glpat-`, `-----BEGIN .* PRIVATE KEY-----`, `Authorization: Bearer \S{20,}`; **CRYPTO_001 (warning)**: `(?i)(api[_-]?key\|secret\|token\|password\|passwd\|pwd)\s*[=:] \s*\S+` |

### Frozen Answers (Decisions Made)
| Topic | Decision |
|-------|----------|
| Content-ref grammar | `<page>.json#/<clave_raiz>` — `<page>` = composition slug, `<clave_raiz>` = top-level key only (single level) |
| Parent_id → layout | DS catalog mandatory `category` field (layout|nav|content|form|media); detection via `category === "layout"` |
| ICON_001 emoji | Primary = whitelist from DS catalog; Secondary = `/\p{Extended_Pictographic}/u` |
| SECRET_001/CRYPTO_001 | Data-driven regex array with exact patterns (see above) |
| RICHTEXT_001 HTML | Regex `/<[^>]+>/` on rich-text fields |
| Package privacy | `"private": true` |

### Next Actions
1. Begin Phase 1: Scaffolding (git init, package.json with exact versions, tsconfig, folder structure, .npmrc, .nvmrc, DECISIONS.md)
2. Verify directory is empty and ready
3. Create initial commit

### Files Status
| File | Status |
|------|--------|
| task_plan.md | ✅ Updated with rectifications + corrections A & B |
| findings.md | ✅ Created |
| progress.md | ✅ Updated with corrections |
| package.json | ⏳ Pending |
| tsconfig.json | ⏳ Pending |
| src/ | ⏳ Pending |
| schemas/ | ⏳ Pending |
| fixtures/ | ⏳ Pending |
| tests/ | ⏳ Pending |
| .npmrc | ⏳ Pending |
| .nvmrc | ⏳ Pending |
| DECISIONS.md | ⏳ Pending |

---

## Phase Tracking

| Phase | Status | Start Date | End Date | Commit |
|-------|--------|------------|----------|--------|
| 1: Scaffolding | 🟡 In Progress | 2026-09-04 | - | - |
| 2: Schemas + Golden | ⏳ Pending | - | - | - |
| 3: Canonicalize + Integrity | ⏳ Pending | - | - | - |
| 4: Validator | ⏳ Pending | - | - | - |
| 5: CLI + Export | ⏳ Pending | - | - | - |
| 6: CI + GitHub | ⏳ Pending | - | - | - |
| 7: Final Verification | ⏳ Pending | - | - | - |