# Domo App Deployment Guide

> Reference guide for deploying Domo custom apps across environments. Covers CLI commands, multi-environment configuration, CI/CD pipelines, and rollback strategies.

---

## CLI Commands

### Scaffold a New App

```bash
# Install the Domo CLI globally
npm install -g @domoinc/toolkit

# Scaffold a new app (interactive wizard)
da new

# The wizard prompts for:
# - App name
# - Template (vanilla, React, Angular)
# - Starter type (basic, chart, form)
```

This creates a project directory with `manifest.json`, starter HTML/JS files, and a `.domoapps` config file.

### Authenticate

```bash
# Login to a Domo instance
domo login

# Prompts for:
# - Instance name (e.g., "mycompany" for mycompany.domo.com)
# - Username (email)
# - Password

# Verify authentication
domo whoami
# Output: Logged in as user@example.com on mycompany.domo.com
```

Authentication tokens are stored in `~/.domo/` and persist across sessions until they expire.

### Local Development

```bash
# Start local dev server with Domo proxy
domo dev

# This:
# 1. Starts a local server (default port 3000)
# 2. Proxies API calls to your Domo instance
# 3. Injects the domo SDK (ryuu.js) automatically
# 4. Hot-reloads on file changes

# For React apps, run Vite dev server and domo dev in parallel:
# Terminal 1:
npm run dev          # Vite dev server on port 5173
# Terminal 2:
domo dev             # Domo proxy on port 3000
```

### Publish (Deploy)

```bash
# Deploy to Domo
domo publish

# First publish prompts for:
# - Instance confirmation
# - App name
# - Design creation (new app) vs update (existing app)

# After first publish, manifest.json is updated with:
# - "id": "<design-uuid>"       — the app design ID
# - "proxyId": "<proxy-uuid>"   — the proxy configuration ID

# Subsequent publishes detect these IDs and update the existing app
```

### Version Management

```bash
# Before publishing a new version, bump the version in manifest.json:
{
  "name": "My App",
  "version": "1.2.0",    // Bump this before each publish
  ...
}

# The published version appears in Domo's app management UI.
# Domo keeps all published versions — you can revert to any previous version.
```

---

## Multi-Environment Deployment

Production Domo apps typically target multiple instances (dev, staging, production) with different dataset IDs, collection IDs, and package IDs per environment.

### manifestOverrides.json Structure

Create a `manifestOverrides.json` file (git-ignored) that maps environment names to manifest field overrides:

```json
{
  "dev": {
    "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "proxyId": "dev-proxy-id",
    "mapping": [
      {
        "dataSetId": "dev-dataset-uuid-1",
        "alias": "salesData",
        "fields": []
      }
    ],
    "collections": [
      {
        "name": "UserPreferences",
        "id": "dev-collection-uuid-1",
        "schema": {
          "columns": [
            { "type": "STRING", "name": "userId" },
            { "type": "STRING", "name": "theme" }
          ]
        },
        "syncEnabled": false
      }
    ]
  },
  "staging": {
    "id": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
    "proxyId": "staging-proxy-id",
    "mapping": [
      {
        "dataSetId": "staging-dataset-uuid-1",
        "alias": "salesData",
        "fields": []
      }
    ],
    "collections": [
      {
        "name": "UserPreferences",
        "id": "staging-collection-uuid-1",
        "schema": {
          "columns": [
            { "type": "STRING", "name": "userId" },
            { "type": "STRING", "name": "theme" }
          ]
        },
        "syncEnabled": false
      }
    ]
  },
  "production": {
    "id": "kkkkkkkk-llll-mmmm-nnnn-oooooooooooo",
    "proxyId": "production-proxy-id",
    "mapping": [
      {
        "dataSetId": "production-dataset-uuid-1",
        "alias": "salesData",
        "fields": []
      }
    ],
    "collections": [
      {
        "name": "UserPreferences",
        "id": "production-collection-uuid-1",
        "schema": {
          "columns": [
            { "type": "STRING", "name": "userId" },
            { "type": "STRING", "name": "theme" }
          ]
        },
        "syncEnabled": false
      }
    ]
  }
}
```

### Deploy Script Pattern

Create a `deploy.js` script that merges the base manifest with environment overrides and publishes:

```javascript
// deploy.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const env = process.argv[2];
if (!env) {
  console.error('Usage: node deploy.js <environment>');
  console.error('Environments: dev, staging, production');
  process.exit(1);
}

// Load base manifest and overrides
const manifestPath = path.join(__dirname, 'manifest.json');
const overridesPath = path.join(__dirname, 'manifestOverrides.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf-8'));

if (!overrides[env]) {
  console.error(`No overrides found for environment: ${env}`);
  console.error(`Available: ${Object.keys(overrides).join(', ')}`);
  process.exit(1);
}

// Merge: overrides replace top-level keys in the manifest
const merged = { ...manifest, ...overrides[env] };

// Back up the original manifest
const backupPath = path.join(__dirname, 'manifest.json.bak');
fs.copyFileSync(manifestPath, backupPath);

try {
  // Write the merged manifest
  fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 2) + '\n');
  console.log(`Deploying to ${env}...`);
  console.log(`  App ID: ${merged.id || '(new app)'}`);
  console.log(`  Version: ${merged.version}`);
  console.log(`  Datasets: ${merged.mapping?.length ?? 0}`);
  console.log(`  Collections: ${merged.collections?.length ?? 0}`);

  // Login to the target instance
  const instanceMap = {
    dev: 'mycompany-dev',
    staging: 'mycompany-staging',
    production: 'mycompany',
  };

  console.log(`\nLogging in to ${instanceMap[env]}...`);
  execSync(`domo login --instance ${instanceMap[env]}`, { stdio: 'inherit' });

  // Build (if React app)
  if (fs.existsSync(path.join(__dirname, 'package.json'))) {
    console.log('\nBuilding...');
    execSync('npm ci && npm run build', { stdio: 'inherit' });
  }

  // Publish
  console.log('\nPublishing...');
  execSync('domo publish', { stdio: 'inherit' });

  console.log(`\nSuccessfully deployed v${merged.version} to ${env}`);

  // If this was a first-time deploy, the publish may have assigned an ID.
  // Read it back and update the overrides file so next deploy is an update.
  const publishedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  if (publishedManifest.id && publishedManifest.id !== overrides[env].id) {
    overrides[env].id = publishedManifest.id;
    overrides[env].proxyId = publishedManifest.proxyId;
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2) + '\n');
    console.log(`Updated overrides with new app ID: ${publishedManifest.id}`);
  }

} finally {
  // Restore the original manifest
  fs.copyFileSync(backupPath, manifestPath);
  fs.unlinkSync(backupPath);
  console.log('\nRestored original manifest.json');
}
```

### Usage

```bash
# Deploy to dev
node deploy.js dev

# Deploy to staging
node deploy.js staging

# Deploy to production
node deploy.js production
```

### .gitignore Additions

```gitignore
# Environment-specific overrides (contains instance-specific UUIDs)
manifestOverrides.json
manifest.json.bak

# Domo CLI config
.domoapps
```

---

## CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Domo App

on:
  push:
    branches:
      - main          # Auto-deploy to dev on merge to main
    tags:
      - 'v*'          # Deploy to production on version tag

  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - production

env:
  NODE_VERSION: '18'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --ci --coverage

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || (startsWith(github.ref, 'refs/tags/v') && 'production' || 'dev') }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Install Domo CLI
        run: npm install -g @domoinc/toolkit

      - name: Determine environment
        id: env
        run: |
          if [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
            echo "target=${{ github.event.inputs.environment }}" >> "$GITHUB_OUTPUT"
          elif [[ "${{ github.ref }}" == refs/tags/v* ]]; then
            echo "target=production" >> "$GITHUB_OUTPUT"
          else
            echo "target=dev" >> "$GITHUB_OUTPUT"
          fi

      - name: Write manifest overrides
        run: echo '${{ secrets.MANIFEST_OVERRIDES }}' > manifestOverrides.json

      - name: Deploy
        env:
          DOMO_CLIENT_ID: ${{ secrets.DOMO_CLIENT_ID }}
          DOMO_CLIENT_SECRET: ${{ secrets.DOMO_CLIENT_SECRET }}
        run: node deploy.js ${{ steps.env.outputs.target }}
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOMO_CLIENT_ID` | OAuth client ID for CI/CD service account |
| `DOMO_CLIENT_SECRET` | OAuth client secret |
| `MANIFEST_OVERRIDES` | Full JSON content of `manifestOverrides.json` |

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'production'],
            description: 'Target deployment environment'
        )
    }

    environment {
        NODE_VERSION = '18'
        DOMO_CLIENT_ID = credentials('domo-client-id')
        DOMO_CLIENT_SECRET = credentials('domo-client-secret')
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test -- --ci --coverage'
            }
            post {
                always {
                    junit 'junit.xml'
                    publishHTML([
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'manifest-overrides', variable: 'OVERRIDES_FILE')]) {
                    sh 'cp $OVERRIDES_FILE manifestOverrides.json'
                    sh "node deploy.js ${params.ENVIRONMENT}"
                }
            }
        }
    }

    post {
        success {
            slackSend(
                color: 'good',
                message: "Deployed v${readJSON(file: 'manifest.json').version} to ${params.ENVIRONMENT}"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "Deploy to ${params.ENVIRONMENT} FAILED"
            )
        }
    }
}
```

---

## Version Management Strategy

### Semantic Versioning for Domo Apps

| Change Type | Version Bump | Examples |
|-------------|-------------|---------|
| Bug fix, style tweak | Patch (1.0.X) | Fix chart color, fix filter bug |
| New feature, new data source | Minor (1.X.0) | Add export button, add new dataset |
| Breaking change, major redesign | Major (X.0.0) | New UI framework, schema change |

### Version Bump Script

```json
{
  "scripts": {
    "version:patch": "node -e \"const m=require('./manifest.json'); const v=m.version.split('.'); v[2]=+v[2]+1; m.version=v.join('.'); require('fs').writeFileSync('manifest.json',JSON.stringify(m,null,2)+'\\n'); console.log('Version bumped to '+m.version)\"",
    "version:minor": "node -e \"const m=require('./manifest.json'); const v=m.version.split('.'); v[1]=+v[1]+1; v[2]=0; m.version=v.join('.'); require('fs').writeFileSync('manifest.json',JSON.stringify(m,null,2)+'\\n'); console.log('Version bumped to '+m.version)\"",
    "version:major": "node -e \"const m=require('./manifest.json'); const v=m.version.split('.'); v[0]=+v[0]+1; v[1]=0; v[2]=0; m.version=v.join('.'); require('fs').writeFileSync('manifest.json',JSON.stringify(m,null,2)+'\\n'); console.log('Version bumped to '+m.version)\""
  }
}
```

### Pre-Deploy Checklist

Before deploying to production:

1. Run all tests: `npm test`
2. Build succeeds: `npm run build`
3. Version bumped: `npm run version:minor` (or patch/major)
4. Changelog updated (if maintained)
5. Deploy to staging first: `node deploy.js staging`
6. Verify in staging Domo instance
7. Deploy to production: `node deploy.js production`
8. Tag the release: `git tag v1.2.0 && git push --tags`

---

## Rollback Approach

### Via Domo UI

1. Go to **Admin > Custom Apps** in your Domo instance
2. Find the app design
3. Click **Versions** to see all published versions
4. Select a previous version and click **Restore**

This is the fastest rollback method — no code or CLI needed.

### Via CLI (Re-publish Previous Version)

```bash
# Check out the previous version's code
git checkout v1.1.0

# Build (if React)
npm ci && npm run build

# Publish — this creates a new version that is a copy of the old code
domo publish
```

### Via API (Programmatic Rollback)

```bash
# List all versions of a design
curl -H "Authorization: bearer $TOKEN" \
  "https://mycompany.domo.com/api/apps/v1/designs/$DESIGN_ID/versions"

# Get the version number you want to restore, then update the design
# to point to that version (this requires admin API access)
```

### Rollback Decision Matrix

| Situation | Approach |
|-----------|----------|
| Bad deploy, need immediate fix | Domo UI version restore (fastest) |
| Need to redeploy with a code fix | Fix code, bump version, re-publish |
| Need to roll back data mappings | Use manifestOverrides.json with old dataset IDs |
| Broken build, can't publish | Domo UI version restore while fixing build |

---

## Troubleshooting Deployment

| Issue | Cause | Fix |
|-------|-------|-----|
| `domo publish` hangs | Auth token expired | Run `domo login` again |
| `domo publish` says "design not found" | Wrong instance or `id` in manifest | Verify `domo whoami` matches the target instance |
| App deploys but shows old version | Browser cache | Hard refresh (Ctrl+Shift+R) or clear Domo cache |
| Datasets not binding after deploy | `"datasetsMapping"` used instead of `"mapping"` | Fix manifest to use `"mapping"` key |
| Collections missing after deploy | `"collectionsMapping"` used instead of `"collections"` | Fix manifest to use `"collections"` key |
| React app shows blank page | Build output not in expected directory | Verify `fileName` in manifest matches build output path |
| Different data in staging vs production | manifestOverrides pointing to wrong dataset IDs | Audit `manifestOverrides.json` for each environment |
