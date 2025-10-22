/**
 * Version Update Script
 *
 * Automatically updates the APP_VERSION in index.html
 * from the version in package.json before each build.
 *
 * Usage: node scripts/updateVersion.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');
const INDEX_HTML_PATH = join(ROOT_DIR, 'index.html');

try {
  console.log('📦 Reading package.json version...');

  // Read package.json
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const version = packageJson.version;

  console.log(`✅ Current version: v${version}`);
  console.log('📝 Updating index.html...');

  // Read index.html
  let indexHtml = readFileSync(INDEX_HTML_PATH, 'utf-8');

  // Update APP_VERSION with current timestamp for additional cache busting
  const timestamp = Date.now();
  const versionString = `v${version}.${timestamp}`;

  // Replace the APP_VERSION line
  indexHtml = indexHtml.replace(
    /const APP_VERSION = ['"]v[\d.]+['"]/,
    `const APP_VERSION = '${versionString}'`
  );

  // Write updated index.html
  writeFileSync(INDEX_HTML_PATH, indexHtml, 'utf-8');

  console.log(`✅ Updated APP_VERSION to: ${versionString}`);
  console.log('🎉 Version update complete!\n');

} catch (error) {
  console.error('❌ Error updating version:', error);
  process.exit(1);
}
