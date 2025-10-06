<div align="center">

# Lore Archive's Wiki Engine

</div>

The Lore Archive Wiki Engine (LAWE) is a [statically-generative](https://en.wikipedia.org/wiki/Static_site_generator) [wiki engine](https://en.wikipedia.org/wiki/Wiki_software) created by [Cieron](https://github.com/Cirrow) for use in the [Lore Archive Wiki](https://lorearchive.org). It takes on a different approach to a traditional wiki, where pages are organized in namespaces rather than no namespaces. It features a dynamic sidebar on the left where all pages can be found.


It ships as little JavaScript to user as possible with the help of [AstroJS](https://astro.build/).

## CPP-LPR
The CPP-LPR version of LAWE replaces the traditional TypeScript versions of the Lexer, Parser, and Renderer pipeline to their repsective C++ versions. Then the C++ versions are compiled to WebAssembly, so that they may be used by the AstroJS framework. It uses the clangd language server and is configured for a NixOS development environment.

### CPP-LPR for NixOS users
After `cd`ing into the project directory, run `nix-shell` to initiate the nix shell.

## Compiling
LAWE fetches its raw content from [law-content](https://github.com/lorearchive/law-content) at compile time, then generates static HTML files (as opposed to rendering whenever a user visits a page), which makes LAWE extremely fast and memory-efficient, while also improving [SEO](https://en.wikipedia.org/wiki/Search_engine_optimization).

In this vein, some may argue that LAWE is not a wiki engine but instead a static site generator. However, I doubt that this engine will be popular enough for people to gather and spend their time engaging in such vain thoughts. For now, let's agree on the name "statically-generative wiki engine" or something similar.

You can start the dev server with:

```bash
npm run dev
```

and compile LAWE with:

```bash
npx astro build
```

or

```bash
npm run astro build
```



## Important acronyms used while compiling
- `LAWE PP`: LAWE Pages-processor. (`/src/utils/pages-processor.ts`) Builds HTML from raw wikitext at compile time.

## Syntax
The syntax (i.e. the raw wikitext syntax) that the engine supports similar (partially overlaps) to that of the [DokuWiki](https://www.dokuwiki.org/dokuwiki) [syntax](https://www.dokuwiki.org/wiki:syntax). In fact, in the early days of the Lore Archive Wiki, DokuWiki was used as the engine behind the site. When I decided to create my own engine, I thought it would be troublesome to create a whole new syntax and adapt the old pages to the new syntax.

Major markup syntax is identical to the DokuWiki syntax, including bold, underline, italic and a few other simple inline things. However the LAWE syntax brings about improvements, which can be found in [SYNTAX](https://github.com/lorearchive/LAWE/blob/main/SYNTAX.md). The syntax is also extended to support extra features which in DokuWiki required plugins to achieve.
