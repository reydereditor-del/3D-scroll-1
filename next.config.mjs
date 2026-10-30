const staticExport = process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const config = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  ...(staticExport ? { output: 'export', trailingSlash: true } : {}),
};

export default config;
