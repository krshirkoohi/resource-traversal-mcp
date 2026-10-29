import { chromium } from 'playwright';
import { detectService, extractNotion, extractGeneric } from './lib/extractors';
import { fetchAuthenticated, hasAuthSession } from './lib/browser';

async function runTests() {
    console.log('🧪 Starting Resource Traversal MCP Test Suite...\n');
    let failedChecks = 0;

    // 1. Test Service Detection
    console.log('--- Test 1: Service Detection ---');
    const testCases = [
        { url: 'https://gemini.google.com/app/12345', expected: 'gemini' },
        { url: 'https://docs.google.com/document/d/abc/edit', expected: 'googleDocs' },
        { url: 'https://notebooklm.google.com/notebook/xyz', expected: 'notebookLM' },
        { url: 'https://chatgpt.com/c/67890', expected: 'chatgpt' },
        { url: 'https://grok.com/c/11223', expected: 'grok' },
        { url: 'https://discord.com/channels/123/456', expected: 'discord' },
        { url: 'https://company.slack.com/archives/C123/p456', expected: 'slack' },
        { url: 'https://www.notion.so/workspace/My-Project-Page-12345678', expected: 'notion' },
        { url: 'https://app.notion.com/p/kavia/Drift-Detector-38f742f3bdfe81cc8022ca0d55a1a648', expected: 'notion' },
        { url: 'https://docs.notion.site/guide/intro', expected: 'notion' },
        { url: 'https://app.raindrop.io/my/0', expected: 'raindrop' },
        { url: 'https://linear.app/team/issue/ENG-101', expected: null },
        { url: 'https://company.atlassian.net/browse/JIRA-42', expected: null },
        { url: 'https://en.wikipedia.org/wiki/Antigravity', expected: null },
    ];

    let detectPassed = 0;
    for (const { url, expected } of testCases) {
        const detected = detectService(url);
        if (detected === expected) {
            console.log(`  ✅ [PASS] ${url} -> ${detected}`);
            detectPassed++;
        } else {
            console.error(`  ❌ [FAIL] ${url} -> got ${detected}, expected ${expected}`);
            failedChecks++;
        }
    }
    console.log(`Service Detection: ${detectPassed}/${testCases.length} passed.\n`);

    // 2. Test Notion Extractor on Mocked HTML DOM (including display:contents, columns, sub-page buttons, and login walls)
    console.log('--- Test 2: Notion Extractor DOM Parsing & Login-Wall Guard ---');
    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    const mockNotionHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>System Architecture | Notion</title></head>
        <body>
            <div class="notion-sidebar">Sidebar content to ignore</div>
            <div class="notion-topbar">Topbar navigation to ignore</div>
            <div class="whenContentEditable" style="display: contents;">
                <div data-block-id="page-root" class="notion-selectable notion-page-block">
                    <h1 placeholder="New page">Project Overview</h1>
                </div>
                <div class="notion-page-content" style="display: contents;">
                    <div class="notion-presence-container">User avatar list</div>
                    <div data-block-id="b1" class="notion-selectable notion-header-block">Architecture & Stack</div>
                    <div data-block-id="b2" class="notion-selectable notion-text-block">The core platform utilizes headless Chromium and Bun runtime.</div>
                    <div data-block-id="b3" class="notion-selectable notion-to_do-block">
                        <input type="checkbox" checked /> Implement Notion extractor
                    </div>
                    <div data-block-id="b4" class="notion-selectable notion-to_do-block">
                        <input type="checkbox" /> Add universal fallback
                    </div>
                    <div data-block-id="b5" class="notion-selectable notion-callout-block">
                        Note: Zero-cloud privacy guarantees local hardware security.
                    </div>
                    <div data-block-id="b6" class="notion-selectable notion-code-block">
                        console.log("Traversal ready");
                    </div>
                    <div data-block-id="col-list" class="notion-selectable notion-column_list-block">
                        <div data-block-id="col-1" class="notion-selectable notion-column-block">
                            <div data-block-id="subpage-1" class="notion-selectable notion-page-block">
                                <div role="button"><span class="notion-record-icon">🌟</span><span>What’s New?</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    await page.setContent(mockNotionHTML);
    const notionOutput = await extractNotion(page);
    console.log('Extracted Notion Output:\n');
    console.log(notionOutput);
    console.log('\n----------------------------------------');

    const notionValidations = [
        notionOutput.includes('# Project Overview'),
        notionOutput.includes('## Architecture & Stack'),
        notionOutput.includes('- [x] Implement Notion extractor'),
        notionOutput.includes('- [ ] Add universal fallback'),
        notionOutput.includes('> Note: Zero-cloud privacy guarantees local hardware security.'),
        notionOutput.includes('```\nconsole.log("Traversal ready");\n```'),
        notionOutput.includes('- 🌟 What’s New?'),
        !notionOutput.includes('Sidebar content to ignore'),
        !notionOutput.includes('Topbar navigation to ignore'),
    ];

    if (notionValidations.every(Boolean)) {
        console.log('✅ [PASS] Notion DOM Extractor correctly parsed all blocks, nested columns, and sub-pages.\n');
    } else {
        console.error('❌ [FAIL] Notion Extractor failed one or more assertions.\n');
        failedChecks++;
    }

    // Verify login-wall detection on unauthenticated Notion response
    await page.setContent(`
        <!DOCTYPE html>
        <html><head><title>Notion</title></head>
        <body><div>You’re almost there! Sign in to see this page in Notion.</div></body></html>
    `);
    let loginWallCaught = false;
    try {
        await extractNotion(page);
    } catch (err) {
        loginWallCaught = err instanceof Error && err.message.includes('Session expired');
    }
    if (loginWallCaught) {
        console.log('✅ [PASS] Notion Extractor accurately detected unauthenticated login wall.\n');
    } else {
        console.error('❌ [FAIL] Notion Extractor did not throw on login wall.\n');
        failedChecks++;
    }

    // 3. Test Universal Generic Extractor on Mocked Web Article
    console.log('--- Test 3: Universal Generic Extractor ---');
    const mockGenericHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Quantum Computing Breakthrough</title></head>
        <body>
            <header role="banner">Site Header with Links</header>
            <nav role="navigation">Home | About | Contact</nav>
            <div class="cookie-banner">Please accept cookies</div>
            <main>
                <article>
                    <h1>New Superconducting Qubit Design</h1>
                    <p>Researchers have achieved a coherence time of 10 milliseconds in a 3D transmon cavity.</p>
                    <p>This provides substantial improvements for quantum error correction thresholds.</p>
                </article>
            </main>
            <div class="sidebar">Sponsored Links and Ads</div>
            <footer>Copyright 2026. All rights reserved.</footer>
        </body>
        </html>
    `;

    await page.setContent(mockGenericHTML);
    const genericOutput = await extractGeneric(page);
    console.log('Extracted Generic Output:\n');
    console.log(genericOutput);
    console.log('\n----------------------------------------');

    const genericValidations = [
        genericOutput.includes('New Superconducting Qubit Design'),
        genericOutput.includes('Researchers have achieved a coherence time'),
        !genericOutput.includes('Please accept cookies'),
        !genericOutput.includes('Site Header with Links'),
        !genericOutput.includes('Copyright 2026'),
    ];

    if (genericValidations.every(Boolean)) {
        console.log('✅ [PASS] Universal Generic Extractor successfully isolated article and stripped noise.\n');
    } else {
        console.error('❌ [FAIL] Generic Extractor failed one or more assertions.\n');
        failedChecks++;
    }

    // 4. Live-Validate Notion Extractor on Public Notion Site
    console.log('--- Test 4: Live Notion Extractor Validation (https://notion.notion.site/) ---');
    try {
        await page.goto('https://notion.notion.site/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(6000);
        const liveNotion = await extractNotion(page);
        console.log(`Live Notion Preview:\n${liveNotion.substring(0, 250)}...`);
        if (
            liveNotion.includes('# Notion Official') &&
            liveNotion.includes('What’s New?') &&
            !liveNotion.includes('🌟What’s New?')
        ) {
            console.log('\n✅ [PASS] Live Notion Extractor validated against real Notion DOM.\n');
        } else {
            console.error('\n❌ [FAIL] Live Notion extraction did not match expected live block formatting.\n');
            failedChecks++;
        }
    } catch (err) {
        console.error('❌ [FAIL] Live Notion validation encountered error:', err);
        failedChecks++;
    }

    await browser.close();

    // 5. Test Live Headless Engine
    console.log('--- Test 5: Live Headless Chromium Engine ---');
    if (hasAuthSession()) {
        console.log('Traversing live public URL: https://example.com ...');
        try {
            const liveResult = await fetchAuthenticated('https://example.com', true);
            console.log(`Live Page Title: "${liveResult.title}"`);
            console.log(`Live Content Preview:\n${liveResult.content.substring(0, 200)}...`);
            if (liveResult.title.toLowerCase().includes('example') && liveResult.content.length > 50) {
                console.log('\n✅ [PASS] Live Headless Engine traversed and extracted content successfully.');
            } else {
                console.error('\n❌ [FAIL] Live result did not match expected structure.');
                failedChecks++;
            }
        } catch (err) {
            console.error('❌ [FAIL] Live traversal encountered error:', err);
            failedChecks++;
        }
    } else {
        console.log('ℹ️ Skipping authenticated profile fetch (no .auth/chromium-profile present in CI environment).');
    }

    if (failedChecks > 0) {
        console.error(`\n❌ Test Suite Failed with ${failedChecks} failing check(s).`);
        process.exit(1);
    }

    console.log('\n🎉 Test Suite Completed.');
}

runTests().catch((err) => {
    console.error(err);
    process.exit(1);
});
