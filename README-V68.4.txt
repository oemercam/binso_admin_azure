Binso One V68.4 - Azure pnpm symlink materialization fix

Root cause addressed:
Azure ZipDeploy/OneDeploy can materialize pnpm symlinks incorrectly. In the failing runtime,
/node_modules/next was a regular file whose contents were the pnpm symlink target path,
causing Node.js to parse that path as JavaScript and throw SyntaxError: Unexpected token '.'.

Changes:
- Materialize the complete Next.js standalone runtime with `cp -aL` before zipping.
- Assert `node_modules/next` and `@swc/helpers` are physical directories, not symlinks.
- Verify Next runtime resolution from the materialized deployment root.
- Verify the ZIP contains physical `next/package.json` and SWC helper files.
- Ensure Azure app settings include `BUILD_FLAGS=Off` in addition to the existing build-off flags.
