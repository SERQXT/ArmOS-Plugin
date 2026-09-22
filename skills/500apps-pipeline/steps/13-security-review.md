# Stage SEC -- ProCode Security Review

**Stage code:** `stage-sec`
**Checkpoint:** `@500apps-pipeline checkpoint=stage-sec status=complete`

## Purpose

Security audit gate before the app is released to the customer. Runs 70 checks across OWASP Top 10, LLM/Agentic/MCP security, Domo SDK safety, secrets exposure, injection risks, CSRF, and dependency supply chain. Produces a structured report and auto-fixes CRITICAL/HIGH findings.

This stage runs AFTER the build is finalized (stage K -- MVP2 handoff) and BEFORE delivery documentation (stage N). The app is still on the internal Domo instance at this point -- the customer is never exposed to a vulnerable app.

## Inputs

| Source | What to read |
|--------|-------------|
| `code/` | Full app source code (HTML, JS/TS, CSS, manifest, config) |
| `manifest.json` | Dataset mappings, collections, packages, app name |
| `package.json` | Dependencies (React apps) |
| `artifacts/MVP2-NOTES.md` | What was built, features, integrations (for context) |
| `artifacts/MVP-V1-NOTES.md` | Fallback if MVP2 notes not available |
| `spec/BUILD-SPEC.md` | Scope, data bindings, acceptance criteria (for context) |

## Execution

1. **Read the `procode-security-review` skill** and follow its full instructions. The skill defines all 72 checks, the audit methodology, and the report format.

2. **Run the audit** against the `code/` directory. The skill handles:
   - Reconnaissance (manifest, dependencies, entry points, config)
   - Systematic checks across all 12 categories
   - Evidence collection (file:line:snippet for every finding)
   - Severity classification (CRITICAL, HIGH, MEDIUM, LOW)

3. **Write the report** to `artifacts/SECURITY-REVIEW.md`. The report includes:
   - Executive summary with pass/fail counts
   - Deploy gate verdict (BLOCK DEPLOY / PROCEED WITH CAVEATS / CLEAR TO DEPLOY)
   - Full checklist with evidence
   - Detailed findings for every FAIL and REVIEW
   - Auto-fix summary

4. **Auto-fix CRITICAL and HIGH findings** in `code/`:
   - Apply fixes directly in the source files
   - Re-run the specific checks to verify each fix
   - Update the report with fix status
   - If a fix cannot be applied automatically, mark it `MANUAL FIX REQUIRED`

5. **Evaluate the deploy gate:**

   - **CLEAR TO DEPLOY** (0 CRITICAL, 0 HIGH remaining after auto-fix):
     Emit the checkpoint and proceed to delivery (stage N).

   - **PROCEED WITH CAVEATS** (0 CRITICAL, 0 HIGH remaining, but MEDIUM findings exist):
     Emit the checkpoint. Note the MEDIUM findings in the report for follow-up.

   - **BLOCK DEPLOY** (CRITICAL or HIGH findings remain after auto-fix):
     Do NOT emit the checkpoint. The pipeline pauses at `paused_checkpoint` for human review.
     Present the blocking findings clearly so the human reviewer can decide how to proceed.

## Outputs

| Artifact | Path |
|----------|------|
| Security review report | `artifacts/SECURITY-REVIEW.md` |
| Fixed source code | `code/` (modified in place if auto-fixes applied) |

## Checkpoint

Only emit after the deploy gate passes (CLEAR TO DEPLOY or PROCEED WITH CAVEATS):

```
@500apps-pipeline checkpoint=stage-sec status=complete
```

If the deploy gate is BLOCK DEPLOY, do NOT emit the checkpoint. The pipeline pauses for human intervention.
