import type { ASTNode } from './parser';

export class HTMLRenderer {
  public render(node: ASTNode): string {
    switch (node.type) {
      case 'Document':
        return this.renderChildren(node);
      case 'Paragraph':
        return `<p>${this.renderChildren(node)}</p>`;
      case 'Header':
        const level = Math.min(node.level || 1, 6); // HTML supports h1-h6
        return `<h${level} id="law-heading" class="law-heading-${level}">${this.renderChildren(node)}</h${level}>`;
      case 'Underline':
        return `<u>${this.renderChildren(node)}</u>`
      case 'Bold':
        return `<strong>${this.renderChildren(node)}</strong>`;
      case 'Italic':
        return `<em>${this.renderChildren(node)}</em>`;
      case 'Text':
        return this.escapeHTML(node.value || '');
      case 'InternalLink':
        const url = this.processInternalLinkUrl(node.url || '');
        const text = node.text || url;
        return `<a href="${url}" class="internal-link">${this.escapeHTML(text)}</a>`;
      case 'ExternalLink':
        return `<a href="${node.url || ''}" class="external-link" target="_blank" rel="noopener">${this.escapeHTML(node.text || '')}</a>`;
      case 'UnorderedList':
        return `<ul>${this.renderChildren(node)}</ul>`;
      case 'OrderedList':
        return `<ol>${this.renderChildren(node)}</ol>`;
      case 'ListItem':
        return `<li>${this.renderChildren(node)}</li>`;
      case 'CodeBlock':
        const language = node.language ? ` class="language-${node.language}"` : '';
        return `<pre><code${language}>${this.escapeHTML(node.value || '')}</code></pre>`;
      case 'InlineCode':
        return `<code>${this.escapeHTML(node.value || '')}</code>`;
      case 'Table':
        return `<table class="wiki-table">${this.renderChildren(node)}</table>`;
      case 'TableRow':
        return `<tr>${this.renderChildren(node)}</tr>`;
      case 'TableCell':
        const isHeading = node.isHeading ? 'th' : 'td';
        return `<${isHeading}>${this.renderChildren(node)}</${isHeading}>`;
      default:
        console.warn(`Unknown node type: ${node.type}`);
        return '';
    }
  }

  private renderChildren(node: ASTNode): string {
    if (!node.children) return '';
    return node.children.map(child => this.render(child)).join('');
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private processInternalLinkUrl(url: string): string {
    // Convert wiki-style links to URL format
    // For example: namespace:page to /wiki/namespace/page
    return '/wiki/' + url.replace(/:/g, '/');
  }
}   