import type { ASTNode } from "./parser";

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

            case 'Callout':
                return this.renderCallout(node)

            default:
                console.warn(`Unknown node type ${node.type}.`)
                return ''
        }

    }


    private renderCallout(node: ASTNode): string {
        const type = node.calloutType || 'default'
        const title = node.calloutTitle
        const body = this.renderChildren(node)


        if (title) {
            return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><span id="lawe-callout-span-title">${title}</span><span id="lawe-callout-span-body">${body}</span></div></div> `
        } else {
            return `<div id="lawe-callout-${type}" class="lawe-callout"><div id="lawe-callout-inner"><span id="lawe-callout-span-body">${body}</span></div></div> `
        }


    }

    private renderChildren(node: ASTNode): string {
        if (!node.children) return ''
        return node.children.map(child => this.render(child)).join('')
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