<div align="center">

# Lore Archive's Wiki Engine

</div>

The Lore Archive Wiki Engine (LAWE) is a [static](https://en.wikipedia.org/wiki/Static_site_generator) [wiki engine](https://en.wikipedia.org/wiki/Wiki_software) created by [Cieron](https://github.com/Cirrow) for use in the [Lore Archive Wiki](https://lorearchive.org). It takes on a different approach to a traditional wiki, where pages are organized in namespaces rather than no namespaces. It features a dynamic sidebar on the left where all pages can be found.


It ships as little JavaScript to user as possible with the help of [AstroJS](https://astro.build/).


## Compiling
LAWE fetches its raw content from [law-content](https://github.com/lorearchive/law-content) at compile time, then generates static HTML files (as opposed to rendering whenever a user visits a page), which makes LAWE extremely fast and memory-efficient, while also improving [SEO](https://en.wikipedia.org/wiki/Search_engine_optimization).


## Important acronyms used while compiling
- `LAWE PP`: LAWE Pages-processor. (`/src/utils/pages-processor.ts`) Builds HTML from raw wikitext at compile time.
