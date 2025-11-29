// LPR collectively refers to the lexer - parser - renderer pipeline.

import Lexer from "../src/scripts/Lexing/lexer.ts";
import Parser from "../src/scripts/Parsing/parser.ts";
import Renderer from "../src/scripts/Rendering/renderer.ts";

import { describe, it, expect } from "vitest"

interface Element {
    name: string,
    raw: string,
    expected: string
}

const cases: Element[] = [
    {
        name: "Bold, italic, underline",
        raw: "**Bold**, //italic//, __underline__",
        expected: "<p><strong>Bold</strong>, <em>italic</em>, <u>underline</u></p>"

    },
    {
        name: "Horiz rule, linebreak, newline",
        raw: `----
        line \\\\ break and newline
        newline`,
        expected: `<div id="horiz_rule" class="my-5"><hr /></div><p></p><p>line <br /> break and newline</p><p>newline</p>`

    },
    {
        name: "Callouts",
        raw: `<callout type="warning" title="sumTitle">warningCalloutCOntent</callout> <callout type="info"> e found below.</callout>`,
        expected: `<div id="lawe-callout-warning" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-warning"><svg id="lawe-icon-svg-warning" class="mb-2" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/></svg></span></div><span id="lawe-callout-title-span"><h4>sumTitle</h4></span><span id="lawe-callout-span-body">warningCalloutCOntent</span></div></div><div id="lawe-callout-info" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-info"><svg id="lawe-icon-svg-info" class="mb-2" width="28" height="28" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd"/></svg></span></div><span id="lawe-callout-span-body">e found below.</span></div></div>`
    },
    {
        name: "Image",
        raw: `{{/someImage.png?200|figcaption}}`,
        expected: `<figure id="lawe-figure"  class="lawe-figure-left"><div id="lawe-figure-innerdiv"><a id="lawe-figure-a"><a class="a-no-style" href="https://github.com/lorearchive/law-content/tree/main/images/someImage.png"><img src="https://raw.githubusercontent.com/lorearchive/law-content/main/images/someImage.png" width="200" alt="figcaption" loading="lazy" /></a><figcaption>figcaption</figcaption></div></figure>`

    },
    {
        name: "Link",
        raw: `[[/path/to/page#anchor|Sigma]]`,
        expected: `<p><a href="/wiki/path/to/page#anchor" title="Sigma" id="lawe-link" class="internal">Sigma</a></p>`
    }

]


const lexer = new Lexer()
const parser = new Parser()
const renderer = new Renderer()

//describe('LPR', () => {
    //cases.forEach(({ name, raw, eUntitledxpected }) => {
        //it(name, () => {
            //const tokens = lexer.tokenise(raw)
          //  const ast = parser.parse(tokens)
        //    const html = renderer.render(ast)

      //      expect(html).toBe(expected)
    //    })
  //  })
//})

//describe('Lexer', () => {
//it('analyses tokens from raw wikitext.', () => {
//expect(lexer.tokenise(`<infotable name="seia" />`)).toEqual("sig")
//})
//})

describe('Parser', () => {
    it('generates AST from tokens', () => {
        expect(parser.parse(lexer.tokenise(`<infotable name="seia" />`))).toEqual('sigm')
  })
})
