import type { ASTNode } from "../Parsing/parser";
import { getIconMarkup, type IconName } from "../../assets/Icons";
import { renderAffiliTable } from "./infoTableRenderer.ts";

export default class Renderer {

    public render(node: ASTNode): string {



        switch (node.type) {
            
            case 'Document':
                return this.renderChildren(node)
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
                return `<div id="horiz_rule" class="my-5"><hr /></div>`
            case 'Linebreak':
                return `<br />`
            case 'Newline':
                return '\n'

            case 'Callout':
                return this.renderCallout(node)


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


            default:
                console.warn(`Unknown node type ${node.type}.`)
                return ''
        }

    }

    private renderImage(node: ASTNode): string {       
        return `<figure id="lawe-figure" class="lawe-figure-${node.align}"><div id="lawe-figure-innerdiv"><a id="lawe-figure-a" class="a-no-style" href="https://github.com/lorearchive/law-content/tree/main/images${node.src}"><img src="https://raw.githubusercontent.com/lorearchive/law-content/main/images${node.src}" width="${node.width}" alt="${node.alt}" loading="lazy" /></a><figcaption>${node.alt}</figcaption></div></figure>`
        
    }

    private renderLink(node: ASTNode): string {

        let href = node.href

        if (href?.startsWith("/")) {
            href = href.slice(1)
        }

        return `<a href="/wiki/${href}" title="${node.text}" id="lawe-link" class="${node.linkType}">${node.text}</a>`
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
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div>`

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div>`

                default: 
                    throw new Error("LAWE CALLOUT TYPE UNKNOWN IN ICONS: " + type)
                    //used to suppress errors, probably won't ever come across this
            }


        } else {
            switch(type) {
                case "warning":
                case "success":
                case "danger":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div>`

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div>`

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




    private escapeHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}