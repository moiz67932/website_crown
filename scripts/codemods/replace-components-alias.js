// Codemod: replace all imports/usages of "@/components/..." with correct relative paths
// from each file to src/components preserving subpath.
// Safe for .ts/.tsx; handles static imports, export-from, and dynamic imports.

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');
const srcDir = path.join(projectRoot, 'src');
const componentsDir = path.join(srcDir, 'components');

/**
 * Recursively get all files with extensions in a directory
 */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and .next just in case if script run at root
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'backup') continue;
      yield* walk(fullPath);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      yield fullPath;
    }
  }
}

// Regexes to match alias in import/export/dynamic import and string occurrences
// 1) import ... from "@/components/..."
// 2) export ... from "@/components/..."
// 3) dynamic(() => import("@/components/...")) or import("@/components/...")
const patterns = [
  /(import\s+[^;]*?from\s*['"])(@\/components)(\/[^'\"]*)(['"])/g,
  /(export\s+[^;]*?from\s*['"])(@\/components)(\/[^'\"]*)(['"])/g,
  /((?:^|\W)import\s*\(\s*['"])(@\/components)(\/[^'\"]*)(['"]\s*\))/g,
];

function replaceInFile(file) {
  const relFromFileDirToComponents = path.relative(path.dirname(file), componentsDir).replace(/\\/g, '/');
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const re of patterns) {
    content = content.replace(re, (m, p1, alias, subpath, p4) => {
      const newBase = relFromFileDirToComponents || '.'; // if same dir (unlikely), use '.'
      const next = `${p1}${newBase}${subpath}${p4}`;
      if (next !== m) changed = true;
      return next;
    });
  }

  // Also handle bare usages inside code templates: "@/components/..." not in import syntax
  const stringAlias = /(['"])@\/components(\/[^'\"]*)(['"])/g;
  content = content.replace(stringAlias, (m, q1, subpath, q2) => {
    const newBase = relFromFileDirToComponents || '.';
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
  for (const file of walk(srcDir)) {
    total++;
    const did = replaceInFile(file);
    if (did) updated++;
  }
  console.log(`[codemod] scanned ${total} files, updated ${updated}`);
})();
