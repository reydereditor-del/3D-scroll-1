import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function git(args, options = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `git ${args[0]} failed`);
  return result.stdout.trim();
}

const root = git(['rev-parse', '--show-toplevel']);
if (git(['branch', '--show-current']) === 'main') throw new Error('Publish from the reviewed implementation branch, not main.');
if (git(['status', '--porcelain'])) throw new Error('Commit source changes before publishing the preview.');
const output = resolve(root, 'out');
for (const file of ['index.html', '.nojekyll', 'models/concept.glb']) {
  if (!existsSync(join(output, file))) throw new Error(`Missing out/${file}; run npm run build:pages first.`);
}
const source = git(['rev-parse', 'HEAD']);
const gitDir = git(['rev-parse', '--absolute-git-dir']);
const remote = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', 'gh-pages'], { encoding: 'utf8' });
if (remote.error) throw remote.error;
let parent;
if (remote.status === 0) {
  git(['fetch', '--no-tags', 'origin', 'refs/heads/gh-pages']);
  parent = git(['rev-parse', 'FETCH_HEAD']);
} else if (remote.status !== 2) throw new Error(remote.stderr || 'Cannot check the Pages branch.');

// A separate index keeps generated files out of the source index and preserves
// the checkout. The normal push rejects concurrent updates without force.
const scratch = mkdtempSync(join(tmpdir(), 'nocturne-pages-'));
try {
  const options = { cwd: output, env: { ...process.env, GIT_INDEX_FILE: join(scratch, 'index') } };
  const artifactGit = args => git([`--git-dir=${gitDir}`, `--work-tree=${output}`, ...args], options);
  artifactGit(['read-tree', '--empty']);
  artifactGit(['add', '--all']);
  const tree = artifactGit(['write-tree']);
  const commit = artifactGit(['commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', `Publish NOCTURNE preview from ${source}`]);
  git(['push', 'origin', `${commit}:refs/heads/gh-pages`]);
  console.log(`Published ${source} to gh-pages. GitHub Pages will deploy this artifact.`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
