# Dependency Versioning Strategy

## Overview

This project uses **pinned versions** for both frontend (npm) and backend (pip) to ensure reproducible builds across all environments: local development, CI/CD, and production.

---

## Frontend (Mobile/Expo)

### Package Management: npm with package-lock.json

**File structure**:
- `apps/mobile/package.json` — Specifies exact versions (`18.3.1`) or compatible ranges (`^54.0.0`)
- `apps/mobile/package-lock.json` — Auto-generated; locks all transitive dependencies

**Versioning principles**:
- **Core runtime** (React, React Native, Expo): Fixed exact versions (e.g., `18.3.1`, `^0.76.0`)
- **Dev tools** (babel, jest, typescript): Caret ranges for minor updates (e.g., `^54.0.0`)
- **Build & bundler tools**: Tilde ranges for patch updates (e.g., `~5.8.3`)

**Current stack** (as of 2026-03-04):
| Package | Version | Reason |
|---------|---------|--------|
| Expo SDK | 54.0.33 | Latest stable. New Architecture. |
| React Native | ^0.76.0 | Latest stable (Oct 2024). |
| React | 18.3.1 | **Exact pinned.** RN 0.76 requires ^18.2.0; React 19 NOT compatible. |
| TypeScript | ~5.8.3 | Current stable (Jan 2025). |
| babel-preset-expo | ^54.0.0 | **FIXED:** Was 55 (SDK 55), now matches SDK 54. |
| jest-expo | ~54.0.0 | **FIXED:** Was 53 (SDK 53), now matches SDK 54. |
| Jest | ^30.0.0 | **UPDATED:** Was 29.7.0, now on latest Jest 30 (2024). |

**To update**:
```bash
cd apps/mobile
npm update react-native  # Updates within caret range
npm install              # Regenerates package-lock.json
```

**To upgrade major version**:
```bash
npm install react-native@^0.77.0
npm install expo@^55.0.0
# Then test extensively—major version changes may break things
```

---

## Backend (API/Python)

### Package Management: pip with requirements.txt + requirements.lock

**File structure**:
- `services/api/requirements.txt` — Primary dependency file (exact pinned versions)
- `services/api/requirements.lock` — Full dependency tree (all transitive deps)
- `services/api/pyproject.toml` — Poetry/setuptools metadata (exact pinned versions)

**Why not floating bounds (`>=`)?**
- ❌ Old approach: `fastapi>=0.116.0` could pull 0.140, 0.150, 0.200, etc.
- ❌ Different machines could have wildly different versions
- ❌ CI/CD inconsistency: local dev ≠ production
- ✅ New approach: `fastapi==0.140.0` means exact same version everywhere

**Current stack** (as of 2026-03-04):
| Package | Version | Reason |
|---------|---------|--------|
| Python | 3.13 | Matches AWS Lambda Python 3.13 runtime. |
| FastAPI | 0.140.0 | **UPDATED:** Was 0.116 (Aug 2024), now on latest (Mar 2025). |
| Uvicorn | 0.40.0 | **UPDATED:** Was 0.35 (May 2024), now on latest (Mar 2025). |
| Boto3 | 1.68.20 | **UPDATED:** Was 1.39 (Jan 2024), now on latest (Mar 2025). |
| python-jose | 3.4.0 | **UPDATED:** Was 3.3.0 (2022), now on latest (2024). |
| Mangum | 0.29.0 | Latest stable. ASGI→Lambda adapter. |

**To install locally**:
```bash
cd services/api
pip install -r requirements.txt    # Installs exact pinned versions
pip install -e .[dev]              # Also installs dev dependencies from pyproject.toml
```

**To install in Lambda** (SAM template):
```yaml
Runtime: python3.13
CodeUri: .
Handler: handler.handler
```
SAM automatically installs `requirements.txt` into the Lambda layer.

**To update one package**:
```bash
# Update in requirements.txt manually (edit file)
# Then regenerate requirements.lock:
pip install --upgrade fastapi==0.150.0
pip freeze > services/api/requirements.lock  # Capture transitive deps
```

**To update all packages safely**:
```bash
pip install --upgrade -r services/api/requirements.txt
pip freeze > services/api/requirements.lock
# Test against DynamoDB in dev environment
# Then commit both files
```

---

## CI/CD Implications

### GitHub Actions (API Deployment)

Workflow: `.github/workflows/deploy-api-dev.yml`

**Install step**:
```yaml
- name: Install dependencies
  run: |
    pip install -r services/api/requirements.txt
    pytest services/api/tests/  # Run tests with exact pinned versions
```

**Result**: Every CI/CD run uses **identical versions** as your local machine. No surprises in production.

### GitHub Actions (Mobile EAS Build)

Workflow: `.github/workflows/eas-preview.yml`

**Install step**:
```yaml
- name: Install dependencies
  run: |
    cd apps/mobile
    npm install  # Uses package-lock.json for exact versions
```

**Result**: EAS builds use **identical npm packages** every time.

---

## Version Update Schedule

### When to update?
- **Security patches**: ASAP (within 24 hours)
- **Bug fixes**: Within 1-2 weeks
- **Minor features**: Once per sprint
- **Major versions**: After thorough testing (1-2 weeks)

### How to check for updates?
```bash
# Frontend
npm outdated -g  # Check outdated packages

# Backend
pip list --outdated  # Check outdated Python packages
```

### Testing after updates
```bash
# Frontend
cd apps/mobile && npm run test

# Backend
cd services/api && python -m pytest tests/ -v

# Integration
Deploy to dev environment and test against real DynamoDB
```

---

## Dependency Security

### Vulnerability scanning
```bash
# Frontend
npm audit  # Built-in npm security scanner

# Backend
pip install safety
safety check -r services/api/requirements.lock
```

### Critical CVEs
If a critical security vulnerability is found:
1. Update only that package (edit requirements.txt)
2. Run full test suite immediately
3. Deploy to dev first (test against real AWS)
4. Deploy to production only if all tests pass

---

## Troubleshooting Version Conflicts

### Problem: "Peer dependency violation in mobile build"
**Solution**:
```bash
cd apps/mobile
npm install  # Regenerate package-lock.json
npm list react react-native  # Verify versions
```

### Problem: "ImportError: cannot import name X" in API
**Check**:
```bash
pip freeze | grep fastapi  # Verify installed version matches requirements.txt
cd services/api && python -c "import fastapi; print(fastapi.__version__)"
```

### Problem: "EAS build fails with SyntaxError"
**Likely cause**: Babel/TypeScript incompatibility
**Solution**:
```bash
cd apps/mobile
npm install babel-preset-expo@latest
npx expo prebuild --clean
```

---

## Migration from Old Versioning

### Old problematic approach:
```txt
fastapi>=0.116.0
uvicorn>=0.35.0
boto3>=1.39.0
```

### New reproducible approach:
```txt
fastapi==0.140.0
uvicorn==0.40.0
boto3==1.68.20
```

**Rationale**: Exact pinning prevents "works on my machine" bugs and ensures production parity with CI/CD.

---

## Next Review Date

**Last reviewed**: 2026-03-04
**Next review**: 2026-04-04 (monthly security updates)

Check:
- [ ] Any critical CVEs?
- [ ] Any new major versions?
- [ ] Any dead dependencies?
