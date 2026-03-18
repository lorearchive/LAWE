#!/bin/bash

if ! command -v cargo &> /dev/null
then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

if ! command -v wasm-pack &> /dev/null
then
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

pnpm astro build