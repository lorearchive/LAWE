#!/bin/bash

# Install wasm-pack binary if it's not already in the path
if ! command -v wasm-pack &> /dev/null
then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

pnpm run build