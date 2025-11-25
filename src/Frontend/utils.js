export function getBaseURL(KB) {
    return `https://web.file.vpc1.us/files/${KB?.kbId}/`;
}

export function generateFilename(html) {
    const title = new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector('title')?.textContent || 'untitled.html';
    return title.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '.html';
}

export function extractHTMLContent(content) {
    if (!content) return null;
    const languageDetected = /```(?<language>\w+)/g.exec(content)?.groups?.language;
    const htmlMatch = content.match(/<html[^>]*>[\s\S]*<\/html>/);
    if (htmlMatch && (!languageDetected || languageDetected === 'html')) {
        return htmlMatch[0];
    }
    return null;
}

export function isContentHTML(content) {
    if (!content) return content;
    const languageDetected = /```(?<language>\w+)/g.exec(content)?.groups?.language;
    return content?.match?.(/<html[^>]*>[\s\S]*<\/html>/) &&
        (!languageDetected || languageDetected === 'html');
}
