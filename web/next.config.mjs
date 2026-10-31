/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite must not be bundled: the bundler breaks its WASM and file loading (observed in the stack gate).
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
};

export default nextConfig;
