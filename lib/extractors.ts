/**
 * Content extractors for specific services
 * Each extractor knows how to pull meaningful content from a particular web app
 */

import type { Page } from 'playwright';

/**
 * URL pattern matchers for routing to correct extractor
 */
export const SERVICE_PATTERNS = {
    gemini: /^https:\/\/gemini\.google\.com\/app\//,
    googleDocs: /^https:\/\/docs\.google\.com\/document\//,
    notebookLM: /^https:\/\/notebooklm\.google\.com\//,
    chatgpt: /^https:\/\/chatgpt\.com\/c\//,
    grok: /^https:\/\/grok\.com\/c\//,
    discord: /^https:\/\/discord\.com\/channels\//,
    slack: /^https:\/\/app\.slack\.com\/client\//,
    raindrop: /^https:\/\/app\.raindrop\.io\/my\//,
} as const;

export type ServiceType = keyof typeof SERVICE_PATTERNS;

/**
 * Detect service type from URL
 */
export function detectService(url: string): ServiceType | null {
    for (const [service, pattern] of Object.entries(SERVICE_PATTERNS)) {
        if (pattern.test(url)) {
            return service as ServiceType;
        }
    }
    return null;
}

/**
 * Extract content from ChatGPT
 */
export async function extractChatGPT(page: Page): Promise<string> {
    // Wait for chat messages to load
    await page.waitForSelector('[data-testid*="conversation-turn"]', { timeout: 15000 }).catch(() => { });
    
    // Scroll up to load older messages (ChatGPT lazy loads)
    console.error('📜 Traversal in progress: Loading full ChatGPT history...');
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
            const scroller = document.querySelector('.react-scroll-to-bottom--css-pgsnv-1n7m0yu') || 
                             document.querySelector('div[class*="overflow-y-auto"]') ||
                             window;
            (scroller as HTMLElement).scrollTop = 0;
        });
        await page.waitForTimeout(1000);
    }

    const messages = await page.evaluate(() => {
        const turns = document.querySelectorAll('[data-testid*="conversation-turn"]');
        const results: string[] = [];
        
        turns.forEach(turn => {
            const isUser = turn.querySelector('[data-testid="user-message"]') !== null;
            // ChatGPT messages are inside prose or markdown classes
            const contentEl = turn.querySelector('.markdown, .prose, [data-message-author-role]');
            
            if (contentEl) {
                const author = isUser ? '**User:**' : '**ChatGPT:**';
                const text = (contentEl as HTMLElement).innerText.trim();
                if (text) {
                    results.push(`${author}\n${text}`);
                }
            }
        });
        
        return results;
    });

    if (messages.length === 0) {
        return await extractGeneric(page);
    }

    return messages.join('\n\n---\n\n');
}

/**
 * Extract content from Grok
 */
export async function extractGrok(page: Page): Promise<string> {
    // Wait for chat content to load - it's quite heavy
    await page.waitForTimeout(10000);
    
    // Aggressive scroll up to load full history
    console.error('📜 Traversal in progress: Loading full Grok history...');
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => {
            const scroller = document.querySelector('div[class*="overflow-y-auto"]') || 
                             document.querySelector('main') || 
                             window;
            (scroller as HTMLElement).scrollTop = 0;
        });
        await page.waitForTimeout(1000);
    }

    const messages = await page.evaluate(() => {
        // Grok uses deeply nested prose/markdown classes
        const msgEls = document.querySelectorAll('.prose, [class*="message"], [data-testid="message-container"]');
        const results: string[] = [];
        
        msgEls.forEach(el => {
            const text = (el as HTMLElement).innerText.trim();
            if (text && text.length > 5) {
                // Determine author
                const container = el.closest('[class*="message"]');
                const isUser = container?.innerText.includes('You') || el.parentElement?.innerText.includes('You');
                const author = isUser ? '**User:**' : '**Grok:**';
                
                if (!results.some(r => r.includes(text.substring(0, 50)))) {
                    results.push(`${author}\n${text}`);
                }
            }
        });
        
        return results;
    });

    if (messages.length === 0) {
        // Fallback: get all main content
        return await page.evaluate(() => {
            const main = document.querySelector('main') || document.body;
            return main.innerText || '';
        });
    }

    return messages.join('\n\n---\n\n');
}

/**
 * Extract content from Slack
 */
export async function extractSlack(page: Page): Promise<string> {
    // Wait for messages to load
    await page.waitForSelector('.c-message_kit__message, [role="listitem"]', { timeout: 15000 }).catch(() => { });
    
    // Aggressive scroll up to load more history
    console.error('📜 Loading Slack history...');
    for (let i = 0; i < 15; i++) {
        await page.evaluate(() => {
            const scroller = document.querySelector('.c-scrollbar__hider') || 
                             document.querySelector('.c-virtual_list__scroll_container') ||
                             window;
            (scroller as HTMLElement).scrollTop = 0;
        });
        await page.waitForTimeout(800);
    }

    const messages = await page.evaluate(() => {
        // Slack messages can have multiple formats
        const messageElements = document.querySelectorAll('.c-message_kit__message, .c-message--light, [role="listitem"]');
        const results: string[] = [];

        messageElements.forEach((el) => {
            const authorEl = el.querySelector('.c-message__sender_button, [data-qa="message_sender_name"], .c-message__sender');
            const bodyEl = el.querySelector('.c-message_kit__blocks, .c-message__body, .c-message__content-body');
            const timeEl = el.querySelector('.c-timestamp__label, .c-timestamp');

            if (authorEl && bodyEl) {
                const author = (authorEl as HTMLElement).innerText.trim();
                const content = (bodyEl as HTMLElement).innerText.trim();
                const time = timeEl ? (timeEl as HTMLElement).innerText.trim() : '';

                if (content && !results.some(m => m.includes(content.substring(0, 50)))) {
                    results.push(`**${author}** [${time}]: ${content}`);
                }
            }
        });

        return results;
    });

    if (messages.length === 0) {
        return await extractGeneric(page);
    }

    return messages.join('\n\n');
}

/**
 * Extract content from Discord
 */
export async function extractDiscord(page: Page): Promise<string> {
    // Wait for message list
    await page.waitForSelector('[role="list"]', { timeout: 15000 }).catch(() => { });

    const messages = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[class*="messageContent-"]');
        const results: string[] = [];

        messageElements.forEach((el) => {
            const container = el.closest('[class*="message-"]');
            if (!container) return;

            const authorEl = container.querySelector('[class*="username-"]');
            const author = authorEl ? (authorEl as HTMLElement).innerText : 'Unknown';
            const content = (el as HTMLElement).innerText;

            if (content) {
                results.push(`**${author}**: ${content}`);
            }
        });

        return results;
    });

    if (messages.length === 0) {
        return await extractGeneric(page);
    }

    return messages.join('\n\n');
}

/**
 * Extract content from a Gemini chat
 */
export async function extractGeminiChat(page: Page): Promise<string> {
    // Wait for chat messages to load
    await page.waitForSelector('[data-message-id]', { timeout: 10000 }).catch(() => { });

    // Extract conversation
    const messages = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[data-message-id]');
        const conversation: string[] = [];

        messageElements.forEach((el) => {
            const text = (el as HTMLElement).innerText?.trim();
            if (text) {
                // Try to determine if it's user or model message
                const isUser = el.closest('[data-speaker="user"]') !== null;
                const prefix = isUser ? '**User:**' : '**Gemini:**';
                conversation.push(`${prefix}\n${text}`);
            }
        });

        return conversation;
    });

    if (messages.length === 0) {
        // Fallback: get all visible text
        return await page.evaluate(() => {
            const main = (document.querySelector('main') || document.body) as HTMLElement;
            return main.innerText || '';
        });
    }

    return messages.join('\n\n---\n\n');
}

/**
 * Extract content from a Google Doc
 */
export async function extractGoogleDoc(page: Page): Promise<string> {
    // Wait for document content to load
    await page.waitForSelector('.kix-appview-editor', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);

    // Google Docs stores text in a complex way. 
    // We'll try to extract from the editor canvas/container.
    const content = await page.evaluate(() => {
        // Method 1: Target the editor container
        const editor = document.querySelector('.kix-appview-editor');
        if (editor) {
            // Remove scripts and styles from the clone
            const clone = editor.cloneNode(true) as HTMLElement;
            const noise = clone.querySelectorAll('script, style, .kix-cursor, .kix-selection-overlay');
            noise.forEach(el => el.remove());
            return clone.innerText || '';
        }

        // Method 2: Fallback to all kix-lineview elements
        const lines = document.querySelectorAll('.kix-lineview');
        if (lines.length > 0) {
            return Array.from(lines).map(l => (l as HTMLElement).innerText).join('\n');
        }

        return '';
    });

    if (!content || content.trim().length < 50) {
        // Last resort: standard body text but excluding known UI noise
        return await extractGeneric(page);
    }

    return content;
}

/**
 * Extract content from NotebookLM
 */
export async function extractNotebookLM(page: Page): Promise<string> {
    // Wait for notebook content to load - it's quite heavy
    console.error('⏳ Waiting for NotebookLM to load...');
    await page.waitForSelector('main, [role="main"], .source-card', { timeout: 20000 }).catch(() => { });
    await page.waitForTimeout(8000);

    // Try to find the chat container
    const messages = await page.evaluate(() => {
        // NotebookLM chat messages often use specific classes or structures
        const chatTurns = document.querySelectorAll('.chat-turn, [class*="message"], .source-card');
        const results: string[] = [];
        
        chatTurns.forEach(turn => {
            const text = (turn as HTMLElement).innerText.trim();
            if (text) {
                // Try to identify user messages vs model messages
                // This is a heuristic as NotebookLM DOM is complex
                const isUser = turn.innerHTML.includes('You') || turn.closest('[class*="user"]') !== null;
                const author = isUser ? '**User:**' : '**NotebookLM:**';
                results.push(`${author}\n${text}`);
            }
        });
        
        return results;
    });

    if (messages.length === 0) {
        // Fallback: get all main text
        return await page.evaluate(() => {
            const main = document.querySelector('main') || document.body;
            // Clone to remove noise
            const clone = main.cloneNode(true) as HTMLElement;
            const noise = clone.querySelectorAll('nav, header, button, [role="navigation"]');
            noise.forEach(el => el.remove());
            return clone.innerText || '';
        });
    }

    return messages.join('\n\n---\n\n');
}

/**
 * Extract content from Raindrop.io bookmarks
 */
export async function extractRaindrop(page: Page): Promise<string> {
    // Wait for bookmark list to load
    await page.waitForSelector('.bookmark', { timeout: 15000 }).catch(() => { });

    const bookmarks = await page.evaluate(() => {
        const items = document.querySelectorAll('.bookmark');
        const results: string[] = [];

        items.forEach((item) => {
            const titleEl = item.querySelector('.title, [class*="title-"]');
            const linkEl = item.querySelector('a') as HTMLAnchorElement;
            const title = titleEl ? (titleEl as HTMLElement).innerText : 'Untitled';
            const url = linkEl ? linkEl.href : 'No URL';

            if (title && url) {
                results.push(`- [${title}](${url})`);
            }
        });

        return results;
    });

    if (bookmarks.length === 0) {
        return await extractGeneric(page);
    }

    return bookmarks.join('\n');
}

/**
 * Generic fallback extractor
 */
export async function extractGeneric(page: Page): Promise<string> {
    return await page.evaluate(() => {
        // Remove scripts, styles, and navigation
        const remove = document.querySelectorAll('script, style, noscript, nav, header, footer');
        remove.forEach(el => el.remove());

        const main = (document.querySelector('main, article, [role="main"]') || document.body) as HTMLElement;
        return main.innerText || '';
    });
}

/**
 * Get the appropriate extractor for a URL
 */
export function getExtractor(url: string): (page: Page) => Promise<string> {
    const service = detectService(url);

    switch (service) {
        case 'gemini':
            return extractGeminiChat;
        case 'googleDocs':
            return extractGoogleDoc;
        case 'notebookLM':
            return extractNotebookLM;
        case 'chatgpt':
            return extractChatGPT;
        case 'grok':
            return extractGrok;
        case 'discord':
            return extractDiscord;
        case 'slack':
            return extractSlack;
        case 'raindrop':
            return extractRaindrop;
        default:
            return extractGeneric;
    }
}
