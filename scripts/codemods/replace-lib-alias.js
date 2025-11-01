// Codemod: replace all imports/usages of "../../src/lib/..." with correct relative paths
// from each file to src/lib preserving subpath.
// Handles .ts/.tsx/.js/.jsx; static imports, export-from, dynamic imports, and string occurrences.

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const srcDir = path.join(projectRoot, 'src');
const libDir = path.join(srcDir, 'lib');
const scriptsDir = path.join(projectRoot, 'scripts');

/**
 * Recursively get all files with extensions in a directory
 */
function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules, .next, backup, dist, build
      if (['node_modules', '.next', 'backup', 'dist', 'build', '.git'].includes(entry.name)) continue;
      yield* walk(fullPath);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

// Regexes to match alias in import/export/dynamic import and string occurrences
// 1) import ... from "../../src/lib/..."
// 2) export ... from "../../src/lib/..."
// 3) dynamic(() => import("../../src/lib/...")) or import("../../src/lib/...")
const patterns = [
  /(import\s+[^;]*?from\s*['"])(@\/lib)(\/[^"]*?)(['"])/g,
  /(export\s+[^;]*?from\s*['"])(@\/lib)(\/[^"]*?)(['"])/g,
  /((?:^|\W)import\s*\(\s*['"])(@\/lib)(\/[^"]*?)(['"]\s*\))/g,
];

function replaceInFile(file) {
  const relFromFileDirToLib = path.relative(path.dirname(file), libDir).replace(/\\/g, '/');
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const re of patterns) {
    content = content.replace(re, (m, p1, alias, subpath, p4) => {
      // Ensure no double slashes when subpath is like "/db" etc.
      const newBase = relFromFileDirToLib || '.';
      const next = `${p1}${newBase}${subpath}${p4}`;
      if (next !== m) changed = true;
      return next;
    });
  }

  // Also handle bare string occurrences: "../../src/lib/..." in code (rare, but can appear)
  const stringAlias = /(['"])@\/lib(\/[^"]*?)(['"])/g;
  content = content.replace(stringAlias, (m, q1, subpath, q2) => {
    const newBase = relFromFileDirToLib || '.';
    changed = true;
    return `${q1}${newBase}${subpath}${q2}`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    return true;
  }
  return false;
}

(function main(){
  if (!fs.existsSync(srcDir)) {
    console.error('src directory not found at', srcDir);
    process.exit(1);
  }
  let total = 0; let updated = 0;
  const roots = [srcDir, scriptsDir];
  for (const root of roots) {
    for (const file of walk(root)) {
      total++;
      const did = replaceInFile(file);
      if (did) updated++;
    }
  }
  console.log(`[codemod:@/lib] scanned ${total} files, updated ${updated}`);
})();
