// Public files need the same prefix as Next's bundles on project Pages sites.
export function assetPath(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
}
