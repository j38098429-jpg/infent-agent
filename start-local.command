#!/bin/zsh
set -eu
cd "${0:A:h}"
infent_node="$(command -v node || true)"
if [[ -z "$infent_node" ]]; then
  infent_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$infent_node" || ! -f node_modules/next/dist/bin/next ]]; then
  print 'Please install Node.js and run npm install in this folder first.'
  exit 1
fi
exec "$infent_node" node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3011
