import fs from 'fs'
import path from 'path'
import type { PageMeta } from '../../utils/git-service.ts';

import type { ASTNode } from "../Parsing/parser";
import { getIconMarkup, type IconName } from "../../assets/Icons";
import { renderAffiliTable } from "./infoTableRenderer.ts";

export default class Renderer {

    private footnoteCounter: number = 0;
    private footnoteDefinitions: string[] = [];

    public resetFootnotes(): void {
        this.footnoteCounter = 0;
        this.footnoteDefinitions = [];
    }

    public getFootnoteDefinitions(): string {
        if (this.footnoteDefinitions.length === 0) return '';
        
        const footnotes = this.footnoteDefinitions
            .map((content, index) => 
                `<li id="fn-${index + 1}" class="mb-4"><div class="footnote-content">${index + 1}. <a href="#fnref-${index + 1}" class="footnote-backref mr-2">⇈</a> ${content}</div></li>`
            )
            .join('');
            
        return `
            <div id="lawe-heading-2-div" class="lawe-heading-div"><h2 id="notes" class="lawe-heading-2"><span class="lawe-heading">Notes</span></h2></div>
            <div class="footnotes-section">
                <ol class="footnotes-list">
                    ${footnotes}
                </ol>
            </div>
        `;
    }

    public render(node: ASTNode): string {

        switch (node.type) {
            
            case 'Document':
                this.resetFootnotes();
                const content = this.renderChildren(node);
                const footnotes = this.getFootnoteDefinitions();
                return content + footnotes;
            case 'Paragraph':
                return `<p>${this.renderChildren(node)}</p>`
            case 'Heading':
                const level = Math.min(node.level || 1, 6) // HTML supports h1-h6
                return `<div id="lawe-heading-${level}-div" class="lawe-heading-div"><h${level} id="${node.ID}" class="lawe-heading-${level}"><span class="lawe-heading">${this.renderChildren(node)}</span></h${level}></div>`
            case 'Underline':
                return `<u>${this.renderChildren(node)}</u>`
            case 'Italic':
                return `<em>${this.renderChildren(node)}</em>`
            case 'Bold':
                return `<strong>${this.renderChildren(node)}</strong>`
            case 'Text':
                return this.escapeHTML(node.value || '')
            case 'Rule':
                return `<div id="horiz_rule"><hr /></div>`
            case 'Linebreak':
                return `<br />`
            case 'Newline':
                return '\n'

            case 'Callout':
                return this.renderCallout(node)

            case 'Blockquote':
                return `<div id="lawe-blockquoteDiv"><blockquote id="lawe-blockquote">${this.renderChildren(node)}</blockquote><cite>— ${node.blockquoteCite}</cite></div>`



            case 'Table': {
                const attrs = this.renderAttributes(node.attributes, { id: "lawe-table" })
                return `<table ${attrs}>${this.renderChildren(node)}</table>`
            }

            case 'TableHead':
                return `<thead>${this.renderChildren(node)}</thead>`
            case 'TableBody':
                return `<tbody>${this.renderChildren(node)}</tbody>`
            case 'TableRow':
                return `<tr>${this.renderChildren(node)}</tr>`
            case 'TableCell':
                return `<td>${this.renderChildren(node)}</td>`

            case 'TableHeaderCell': {
                const attrs = this.renderAttributes(node.attributes, { id: "lawe-table-header-cell" })
                return `<th ${attrs}>${this.renderChildren(node)}</th>`
            }

            case 'InfoTableAffili': {
                 if (node.attributes && node.attributes.name && node.attributes.school) {
                    return renderAffiliTable({ 
                        name: node.attributes.name, 
                        school: node.attributes.school 
                    });
                } else {
                    throw new Error("LAWE RENDERING ERROR: node does not include any name or school information while trying to render affili table");
                }
            }
            

            case 'Image':
                return this.renderImage(node)
                
            case 'Link':
                return this.renderLink(node)

            case 'Footnote':
                return this.renderFootnote(node);
                
            case 'CitationNeeded':
                return this.renderCitationNeeded();
            case 'TripleParentheses':
                return this.renderTripleParentheses(node)


            default:
                console.warn(`Unknown node type ${node.type}.`)
                return ''
        }

    }

    private renderImage(node: ASTNode): string {       
        return `<figure id="lawe-figure" class="lawe-figure-${node.align}"><a id="lawe-figure-a" class="a-no-style" href="https://github.com/lorearchive/law-content/tree/main/images${node.src}"><img src="https://raw.githubusercontent.com/lorearchive/law-content/main/images${node.src}" width="${node.width}" alt="${node.alt}" loading="lazy" /></a><figcaption>${node.alt}</figcaption></figure>`
        
    }

    private renderTripleParentheses(node: ASTNode): string {
        const type = node.tripleParenAlertType

        switch(type) {

            case 'external':
                return `<div id="lawe-alertnotif" class="alert alert-warning alertnotif" role="alert">${getIconMarkup('globe2', {className: "mb-2", color: "black"})}<p><strong>This article is for an external media.</strong> The material being described in this article are not part of the main story or game, and while most of them are considered canon, everything may not be. This wiki only provides the lore side of all external media.<br><span class="alertnotifsubtext"><em>(${node.tripleParenAlertDate}) &middot;</em></span></p></div>`
            case 'unfinished':
                return `<div id="lawe-alertnotif" class="alert alert-warning alertnotif" role="alert">${getIconMarkup('document-text', {className: "mb-2"})}<p>This article is <strong>unfinished</strong>. Pleae wait patiently until the article is complete. You may help speed up the completion process by providing extra details or completing missing sections.<br><span class="alertnotifsubtext"><em>(${node.tripleParenAlertDate}) &middot; <a href="/wiki/alert_notifications">How do you know whether an article is finished?</a> &middot; <a href="#">Learn how and when to remove this message</a></em></span></p></div>`
            default:
                return ''
        }
    }

    private renderFootnote(node: ASTNode): string {
        // Increment counter and get footnote number
        this.footnoteCounter++;
        const fnNum = this.footnoteCounter;
        
        // Render the footnote content
        const content = this.renderChildren(node);
        
        // Store the footnote definition
        this.footnoteDefinitions.push(content);
        
        return `<sup id="fn_anchor-${fnNum}" class="footnote"><a href="#fn-${fnNum}" id="fnref-${fnNum}" class="footnote-link">[${fnNum}]</a></sup>`;
    }

    private renderCitationNeeded(): string {
        return `<sup class="citation-needed" title="Citation needed">[<em>citation needed</em>]</sup>`;
    }

    private renderLink(node: ASTNode): string {

        let href = node.href

        if (href?.startsWith("/")) {
            href = href.slice(1)
        }

        const hrefTitle = href?.replace(/_/g, " ").replace(/^.*\//, "")


        if (node.interwikiDest && node.interwikiId) {
            return `<a href="${href}" title="${node.text}" id="lawe-link" class="${node.linkType} interwiki">${node.text}</a>`
        }

        return `<a href="/wiki/${href}" title="${node.text}" id="lawe-link" class="${node.linkType}">${hrefTitle}</a>`
    }


    private renderCallout(node: ASTNode): string {
        const type = node.calloutType || 'default'
        const title = node.calloutTitle
        const body = this.renderChildren(node)



        if (title) {

            switch(type) {
                case "warning":
                case "success":
                case "danger":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div>`

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div>`

                default: 
                    throw new Error("LAWE CALLOUT TYPE UNKNOWN IN ICONS: " + type)
                    //used to suppress errors, probably won't ever come across this
            }


        } else {
            switch(type) {
                case "warning":
                case "success":
                case "danger":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div>`

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div>`

                default: 
                    throw new Error("LAWE CALLOUT TYPE UNKNOWN IN ICONS: " + type)
                    //used to suppress errors, probably won't ever come across this
            }

        }


    }

    private renderChildren(node: ASTNode): string {
        if (!node.children) return '';
        
        return node.children.map(child => this.render(child)).join('')
    }

    private renderAttributes(attributes?: Record<string, string>, defaults?: Record<string, string>): string {
        const merged: Record<string, string> = { ...(defaults || {}) };

        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                if (key === "class" && merged.class) {
                    // Merge classes (append user classes to default)
                    merged.class += " " + value;
                } else {
                    merged[key] = value;
                }
            }
        }

        return Object.entries(merged)
            .filter(([_, value]) => value.trim() !== '')
            .map(([key, value]) => `${key}="${this.escapeHTML(value)}"`)
            .join(' ');
    }


    private accessMeta(id: string, field: string) {

        try {
            const metaPath = path.join('.wiki', 'meta', `${id}.json`)
            const data = fs.readFileSync(metaPath, 'utf-8');
            const json = JSON.parse(data)

            return json[field];

        } catch {
            return null
        }
    }



    private escapeHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}