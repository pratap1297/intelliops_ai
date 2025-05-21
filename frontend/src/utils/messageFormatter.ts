import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
  headerIds: false, // Don't add ids to headers
  mangle: false, // Don't escape HTML
});

// Custom renderer to handle code blocks with syntax highlighting
const renderer = new marked.Renderer();
renderer.code = (code, language) => {
  return `<pre><code class="language-${language || 'plaintext'} hljs">${code}</code></pre>`;
};

marked.use({ renderer });

import logger from '../lib/logger';
export function formatMessage(content: string): string {
  try {
    // First pass: Convert markdown to HTML
    let formattedContent = marked(content);

    // Second pass: Sanitize HTML to prevent XSS
    formattedContent = DOMPurify.sanitize(formattedContent);

    // Format command blocks specially
    formattedContent = formattedContent.replace(
      /`(.*?)`/g,
      '<code class="inline-code bg-gray-100 text-blue-600 px-1.5 py-0.5 rounded">$1</code>'
    );

    return formattedContent;
  } catch (error) {
    logger.error('Error formatting message:', error);
    return content; // Return original content if formatting fails
  }
}