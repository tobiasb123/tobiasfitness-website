#!/usr/bin/env node
/**
 * Deploys only the Firebase function groups that have changed since the last deploy.
 *
 * Tracks the last deploy point using a git tag ("functions-last-deploy").
 * After each successful deploy the tag is moved forward to HEAD.
 * The models/ → function group dependency map is built automatically by scanning
 * @models/* imports in functions/src at runtime.
 *
 * First-time use (no tag yet): deploys all functions and creates the tag.
 *
 * Usage:
 *   node scripts/deploy-changed-functions.mjs [--dry-run]
 *
 * --dry-run  Print what would be deployed without actually deploying or moving the tag.
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('[dry-run] No deploy or tag changes will be made.\n');

const DEPLOY_TAG = 'functions-last-deploy';
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const FUNCTIONS_SRC = join(REPO_ROOT, 'functions', 'src');

/**
 * Reads functions/src/index.ts and builds a map of:
 *   functions/src/modules/<folderName> → <Firebase export name>
 *
 * Correlates lines like:
 *   import * as auth from './modules/authentication';
 *   exports.auth = auth;
 *
 * This means adding a new function group only requires updating index.ts —
 * no changes to this script.
 */
function buildFunctionGroups() {
  const indexPath = join(FUNCTIONS_SRC, 'index.ts');
  const content = readFileSync(indexPath, 'utf8');

  // import * as <varName> from './modules/<folderName>'
  const importRe = /import \* as (\w+) from ['"]\.\/modules\/(\w+)['"]/g;
  const varToFolder = new Map();
  for (const m of content.matchAll(importRe)) {
    varToFolder.set(m[1], m[2]);
  }

  // exports.<groupName> = <varName>
  const exportRe = /exports\.(\w+)\s*=\s*(\w+)/g;
  const groups = {};
  for (const m of content.matchAll(exportRe)) {
    const [, groupName, varName] = m;
    const folder = varToFolder.get(varName);
    if (folder) {
      groups[`functions/src/modules/${folder}`] = groupName;
    }
  }

  if (Object.keys(groups).length === 0) {
    console.error('Could not detect any function groups from functions/src/index.ts');
    process.exit(1);
  }

  return groups;
}

const FUNCTION_GROUPS = buildFunctionGroups();

/**
 * If any file under these prefixes changed, all function groups must be redeployed
 * because the change may affect every group.
 */
const FORCE_ALL_PREFIXES = [
  'functions/src/shared/',
  'functions/src/index.ts',
  'functions/package.json',
  'functions/tsconfig',
];

// ── Import graph builder ─────────────────────────────────────────────────────

/** Recursively collect all .ts files under a directory. */
function collectTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Build a map of  models/<subfolder>/ → Set<groupName>
 * by scanning @models/... imports in each function group's source tree.
 */
function buildModelDeps(functionGroups) {
  // @models/authentication/interfaces → models/authentication/
  const MODEL_IMPORT_RE = /@models\/([^/'"]+)/g;
  /** @type {Map<string, Set<string>>} */
  const deps = new Map();

  for (const [srcPrefix, group] of Object.entries(functionGroups)) {
    const groupDir = join(REPO_ROOT, srcPrefix);
    for (const file of collectTsFiles(groupDir)) {
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(MODEL_IMPORT_RE)) {
        const modelFolder = `models/${match[1]}/`;
        if (!deps.has(modelFolder)) deps.set(modelFolder, new Set());
        deps.get(modelFolder).add(group);
      }
    }
  }
  return deps;
}

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function fetchTag(tag) {
  try {
    run(`git fetch origin refs/tags/${tag}:refs/tags/${tag} --force`);
    console.log(`Fetched remote tag "${tag}".`);
  } catch {
    // Tag doesn't exist on remote yet — that's fine on first use
  }
}

function tagExists(tag) {
  try {
    run(`git rev-parse --verify refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

function getChangedFiles(baseRef) {
  try {
    // Committed changes since the tag
    const committed = run(`git diff --name-only ${baseRef} HEAD`);
    // Staged but not yet committed
    const staged = run(`git diff --name-only --cached`);
    // Unstaged working-tree changes
    const unstaged = run(`git diff --name-only`);
    return [
      ...new Set([...committed.split('\n'), ...staged.split('\n'), ...unstaged.split('\n')]),
    ].filter(Boolean);
  } catch (e) {
    console.error(`Failed to run git diff against "${baseRef}": ${e.message}`);
    process.exit(1);
  }
}

function moveTag(tag) {
  if (DRY_RUN) {
    console.log(`[dry-run] Would update and push tag "${tag}" to remote.`);
    return;
  }
  try {
    run(`git tag -f ${tag}`);
    run(`git push origin refs/tags/${tag} --force`);
    console.log(`\nUpdated and pushed deploy tag "${tag}" to remote.`);
  } catch (e) {
    console.warn(`Warning: could not update git tag "${tag}": ${e.message}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

// Always fetch the tag first so we have the latest deploy point from any machine
fetchTag(DEPLOY_TAG);

if (!tagExists(DEPLOY_TAG)) {
  console.log(`No "${DEPLOY_TAG}" tag found — deploying all functions for the first time.`);
  if (DRY_RUN) {
    console.log('[dry-run] Would run: firebase deploy --only functions');
  } else {
    execSync('firebase deploy --only functions', { stdio: 'inherit' });
  }
  moveTag(DEPLOY_TAG);
  process.exit(0);
}

const changedFiles = getChangedFiles(DEPLOY_TAG);

if (changedFiles.length === 0) {
  console.log('No changed files detected since last deploy — nothing to do.');
  process.exit(0);
}

console.log(`Changed files since last deploy (${DEPLOY_TAG}):`);
changedFiles.forEach((f) => console.log(`  ${f}`));

// Check if any shared/core file changed → must deploy all groups
const forceAll = changedFiles.some((f) =>
  FORCE_ALL_PREFIXES.some((prefix) => f.startsWith(prefix)),
);
const hasModelChanges = changedFiles.some((f) => f.startsWith('models/'));

let deployTarget;

if (forceAll) {
  console.log('\nShared or model files changed — deploying all functions.');
  deployTarget = 'functions';
} else {
  const groupsToDeploy = new Set();
  const functionGroupEntries = Object.entries(FUNCTION_GROUPS);
  const modelDeps = hasModelChanges ? buildModelDeps(FUNCTION_GROUPS) : null;

  if (modelDeps) {
    console.log('Detected model dependencies:');
    for (const [folder, groups] of modelDeps) {
      console.log(`  ${folder} → [${[...groups].join(', ')}]`);
    }
  }

  for (const file of changedFiles) {
    // Direct function source changes
    for (const [prefix, group] of functionGroupEntries) {
      if (file.startsWith(prefix + '/') || file === prefix) {
        groupsToDeploy.add(group);
      }
    }
    if (modelDeps && file.startsWith('models/')) {
      // Model changes — map to only the groups that depend on them
      for (const [modelPrefix, groups] of modelDeps) {
        if (file.startsWith(modelPrefix)) {
          groups.forEach((g) => groupsToDeploy.add(g));
        }
      }
    }
  }

  if (groupsToDeploy.size === 0) {
    console.log('\nNo function source files changed — nothing to deploy.');
    // Still advance the tag so non-function commits don't accumulate
    moveTag(DEPLOY_TAG);
    process.exit(0);
  }

  deployTarget = [...groupsToDeploy].map((g) => `functions:${g}`).join(',');
  console.log(`\nFunction groups with changes: ${[...groupsToDeploy].join(', ')}`);
}

const cmd = `firebase deploy --only ${deployTarget}`;
console.log(`\nRunning: ${cmd}\n`);

if (DRY_RUN) {
  console.log('[dry-run] Skipping actual deploy.');
} else {
  execSync(cmd, { stdio: 'inherit' });
}

// Only advance the tag if deploy succeeded (execSync would have thrown otherwise)
moveTag(DEPLOY_TAG);
