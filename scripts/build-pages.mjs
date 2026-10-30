import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--webpack'], {
  stdio: 'inherit',
  env: { ...process.env, STATIC_EXPORT: 'true', NEXT_PUBLIC_BASE_PATH: '/3D-scroll-1' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
// GitHub Pages must serve Next's _next files without Jekyll processing.
writeFileSync('out/.nojekyll', '');
