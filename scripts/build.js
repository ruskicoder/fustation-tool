import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('📦 Verifying fustation-tool build output in /dist...\n');

// 1. Verify dist directory
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('❌ /dist directory was not created');
  process.exit(1);
}

const requiredFiles = ['manifest.json', 'content.js', 'background.js', 'assets/content.css'];
for (const file of requiredFiles) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing in /dist: ${file}`);
    process.exit(1);
  }
  console.log(`   ✔ dist/${file}`);
}

// 2. Run Integration Verification Test
console.log('\n2. Running Integration Verification Test (TypeScript)...');
try {
  execSync('npx --yes tsx scratch/test-flow.ts', { cwd: rootDir, stdio: 'inherit' });
  console.log('   ✔ Integration test passed cleanly');
} catch (e) {
  console.error('❌ Integration test failed');
  process.exit(1);
}

console.log('\n✨ BUILD SUCCESSFUL! Clean TypeScript + React TS extension compiled into /dist.');
