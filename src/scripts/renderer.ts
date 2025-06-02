import type { ASTNode } from "./parser";


export default class Renderer {

    public render(node: ASTNode): string {

        switch (node.type) {

            case 'Document':
                return this.renderChildren(node)

            case 'Paragraph':
                return `<p>${this.renderChildren(node)}</p>`

            case 'Heading':
                const level = Math.min(node.level || 1, 6)  // HTML supports h1-h6
                return `<h${level} id="${node.ID}" class="law-heading-${level}">${this.renderChildren(node)}</h${level}>`

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
                

            default:
                console.warn(`Unknown node type ${node.type}.`)
                return ''
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