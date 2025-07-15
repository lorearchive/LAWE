import type { ASTNode } from "../Parsing/parser";
import { getIconMarkup, type IconName } from "../../assets/Icons";
import { renderAffiliTable } from "./infoTableRenderer.ts";
import ImageOptimiser from "../../utils/image-processor.ts"

export default class Renderer {

    public async render(node: ASTNode): Promise<string> {



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

            case 'Image': {
                return this.renderImage(node)
                }

            default:
                console.warn(`Unknown node type ${node.type}.`)
                return ''
        }

    }

    private async renderImage(node: ASTNode): Promise<string> {
        const imageOpter = new ImageOptimiser()
        const imageOpted = await imageOpter.optimizeImage(`https://raw.githubusercontent.com/lorearchive/law-content/main/images${node.src}`, node)
            
        return imageOpted
        
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
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div> `

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-title-span"><h4>${title}</h4></span><span id="lawe-callout-span-body">${body}</span></div></div> `

                default: 
                    throw new Error("LAWE CALLOUT TYPE UNKNOWN IN ICONS: " + type)
                    //used to suppress errors, probably won't ever come across this
            }


        } else {
            switch(type) {
                case "warning":
                case "success":
                case "danger":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div> `

                case "info":
                    return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><div id="lawe-callout-icon"><span id="lawe-callout-icon-span-${type}">${getIconMarkup(type + "-calloutIcon" as IconName, {isCallout: true, calloutType: type, size: 28, className: "mb-2"})}</span></div><span id="lawe-callout-span-body">${body}</span></div></div> `

                default: 
                    throw new Error("LAWE CALLOUT TYPE UNKNOWN IN ICONS: " + type)
                    //used to suppress errors, probably won't ever come across this
            }

        }


    }

    private async renderChildren(node: ASTNode): Promise<string> {
        if (!node.children) return '';
        
        const rendered = await Promise.all(node.children.map(child => this.render(child)));
        return rendered.join('');
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