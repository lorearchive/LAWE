// adding a new syntax ( a note for me ) continued from parser
//11. add a switch case statement in render function
//12. done! EASYYYYYYYYYYY


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
                return `<h${level} id="law-heading" class="law-heading-${level}">${this.renderChildren(node)}</h${level}>`

            case 'Underline':
                return `<u>${this.renderChildren(node)}</u>`

            case 'Italic':
                return `<em>${this.renderChildren(node)}</em>`
            
            case 'Bold':
                return `<strong>${this.renderChildren(node)}</strong>`

            case 'Text':
                return this.escapeHTML(node.value || '')

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