/**
 * Browser utilities for authenticated resource traversal
 * Uses Playwright with persistent Chrome profile to maintain auth sessions
 */
/// <reference types="bun-types" />

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// Store browser profile in project folder for user control
const AUTH_DIR = join(import.meta.dirname, '..', '.auth');
const PROFILE_DIR = join(AUTH_DIR, 'chromium-profile');

/**
 * Check if an authenticated session exists
 */
export function hasAuthSession(): boolean {
    return existsSync(PROFILE_DIR);
}

// Shared browser launch configuration for stealth (Native Headless Architecture)
const BROWSER_ARGS = [
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-infobars',
    '--window-size=1920,1080',
    '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', // Use a modern, realistic UA
];

const IGNORE_DEFAULT_ARGS = ['--enable-automation'];

/**
 * Launch a headed browser for user to authenticate
 * Cookies and session data will be saved to the profile directory
 */
export async function launchForAuth(startUrl: string = 'https://accounts.google.com'): Promise<void> {
    console.log('🔐 Launching browser for authentication...');
    console.log(`📁 Profile will be saved to: ${PROFILE_DIR}`);

    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
        headless: false,
        channel: 'chrome', 
        args: ['--start-maximized', ...BROWSER_ARGS],
        viewport: null, 
        ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    });

    const page = context.pages()[0] || await context.newPage();
    
    // Mask automation for the auth session too
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.goto(startUrl);

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✋ Please log in to the services you want to use (Google, Discord, etc.)');
    console.log('   Once logged in, close the browser window to save the session.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Wait for the browser to be closed by the user (timeout: 5 minutes)
    await context.waitForEvent('close', { timeout: 300000 });

    console.log('✅ Authentication complete. Session saved.');
}

/**
 * Fetch content from a URL using the authenticated session
 * Uses Native Chromium Headless architecture by default.
 */
export async function fetchAuthenticated(url: string, headless: boolean = true): Promise<{ content: string; title: string }> {
    if (!hasAuthSession()) {
        throw new Error('No authenticated session found. Run auth setup first: bun run auth');
    }

    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
        headless: headless,
        channel: 'chrome', // Enforce real Chrome for Native Architecture
        args: BROWSER_ARGS,
        ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    });

    try {
        const page = context.pages()[0] || await context.newPage();
        
        // --- NATIVE STEALTH: Mask automation signature ---
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
        // --------------------------------------------------

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);

        // --- Handle Consent Walls & Slack Redirects ---
        const pageContent = await page.content();
        
        if (pageContent.includes('open this link in your browser') || pageContent.includes('use Slack in your browser')) {
            console.log('🔗 Slack redirect detected. Forcing browser mode...');
            try {
                const browserLink = await page.$('a:has-text("open this link in your browser"), a:has-text("use Slack in your browser"), .p-download_app__use_browser');
                if (browserLink) {
                    await browserLink.click();
                    await page.waitForTimeout(5000);
                }
            } catch (e) {
                console.log('⚠️ Failed to click Slack browser link...');
            }
        }

        if (pageContent.includes('ACCEPT ALL COOKIES') || pageContent.includes('Cookie Consent Manager')) {
            console.log('🛡️  Consent wall detected. Bypassing...');
            try {
                for (const frame of page.frames()) {
                    const button = await frame.$('button:has-text("ACCEPT ALL COOKIES"), button:has-text("Agree and proceed")');
                    if (button) {
                        await button.click();
                        await page.waitForTimeout(5000);
                        break;
                    }
                }
            } catch (e) {
                console.log('⚠️ Failed to handle consent wall...');
            }
        }

        const pageTitle = await page.title();
        const content = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script, style, noscript');
            scripts.forEach(el => el.remove());
            return document.body?.innerText || '';
        });

        return { title: pageTitle, content };
    } finally {
        await context.close();
    }
}

/**
 * Fetch content with service-specific extraction
 * Uses Native Chromium Headless architecture.
 */
export async function fetchWithExtractor(
    url: string,
    extractor: (page: Page) => Promise<string>,
    headless: boolean = true
): Promise<{ content: string; title: string }> {
    if (!hasAuthSession()) {
        throw new Error('No authenticated session found. Run auth setup first: bun run auth');
    }

    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
        headless: headless,
        channel: 'chrome', // Enforce real Chrome for Native Architecture
        args: BROWSER_ARGS,
        ignoreDefaultArgs: IGNORE_DEFAULT_ARGS,
    });

    try {
        const page = context.pages()[0] || await context.newPage();
        
        // --- NATIVE STEALTH: Mask automation signature ---
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
        // --------------------------------------------------

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for dynamic content
        await page.waitForTimeout(5000);

        // --- Handle Consent Walls & Slack Redirects ---
        const pageContent = await page.content();
        
        if (pageContent.includes('open this link in your browser') || pageContent.includes('use Slack in your browser')) {
            console.log('🔗 Slack redirect detected. Forcing browser mode...');
            try {
                const browserLink = await page.$('a:has-text("open this link in your browser"), a:has-text("use Slack in your browser"), .p-download_app__use_browser');
                if (browserLink) {
                    await browserLink.click();
                    await page.waitForTimeout(5000);
                }
            } catch (e) {
                console.log('⚠️ Failed to click Slack browser link...');
            }
        }

        if (pageContent.includes('ACCEPT ALL COOKIES') || pageContent.includes('Cookie Consent Manager')) {
            console.log('🛡️  Consent wall detected. Bypassing...');
            try {
                for (const frame of page.frames()) {
                    const button = await frame.$('button:has-text("ACCEPT ALL COOKIES"), button:has-text("Agree and proceed")');
                    if (button) {
                        await button.click();
                        await page.waitForTimeout(5000);
                        break;
                    }
                }
            } catch (e) {
                console.log('⚠️ Failed to handle consent wall...');
            }
        }

        const title = await page.title();
        console.log(`🌐 (Extractor) Loaded: ${url}`);
        const content = await extractor(page);

        return { title, content };
    } finally {
        await context.close();
    }
}
