<div align="center">

# Lore Archive's Wiki Engine

</div>

The Lore Archive Wiki Engine (LAWE) is a [statically-generated](https://en.wikipedia.org/wiki/Static_site_generator) [wiki engine](https://en.wikipedia.org/wiki/Wiki_software) created by [Cieron](https://github.com/Cirrow) for use in the [Lore Archive Wiki](https://lorearchive.org). It takes on a different approach to a traditional wiki, where pages are organized in namespaces rather than no namespaces. It features a dynamic sidebar on the left where all pages can be found.


It ships as little JavaScript to user as possible with the help of [AstroJS](https://astro.build/).


## Compiling
LAWE fetches its raw content from [law-content](https://github.com/lorearchive/law-content) at compile time, then generates static HTML files (as opposed to rendering whenever a user visits a page), which makes LAWE extremely fast and memory-efficient, while also improving [SEO](https://en.wikipedia.org/wiki/Search_engine_optimization).

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
