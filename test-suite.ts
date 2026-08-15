import { chromium } from 'playwright';
import { detectService, getExtractor, extractNotion, extractGeneric } from './lib/extractors';
import { fetchAuthenticated } from './lib/browser';

async function runTests() {
    console.log('🧪 Starting Resource Traversal MCP Test Suite...\n');

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
        }
    }
    console.log(`Service Detection: ${detectPassed}/${testCases.length} passed.\n`);

    // 2. Test Notion Extractor on Mocked HTML DOM
    console.log('--- Test 2: Notion Extractor DOM Parsing ---');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();

    const mockNotionHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>System Architecture | Notion</title></head>
        <body>
            <div class="notion-sidebar">Sidebar content to ignore</div>
            <div class="notion-topbar">Topbar navigation to ignore</div>
            <div class="notion-page-content">
                <div class="notion-page-block"><h1 class="notion-title">Project Overview</h1></div>
                <div class="notion-presence-container">User avatar list</div>
                <div data-block-id="b1" class="notion-selectable notion-header-block">Architecture & Stack</div>
                <div data-block-id="b2" class="notion-selectable">The core platform utilizes headless Chromium and Bun runtime.</div>
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
        !notionOutput.includes('Sidebar content to ignore'),
        !notionOutput.includes('Topbar navigation to ignore'),
    ];

    if (notionValidations.every(Boolean)) {
        console.log('✅ [PASS] Notion DOM Extractor correctly parsed all blocks and ignored boilerplate UI.\n');
    } else {
        console.error('❌ [FAIL] Notion Extractor failed one or more assertions.\n');
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
    }

    await browser.close();

    // 4. Test Live Headless Engine
    console.log('--- Test 4: Live Headless Chromium Engine ---');
    console.log('Traversing live public URL: https://example.com ...');
    try {
        const liveResult = await fetchAuthenticated('https://example.com', true);
        console.log(`Live Page Title: "${liveResult.title}"`);
        console.log(`Live Content Preview:\n${liveResult.content.substring(0, 200)}...`);
        if (liveResult.title.toLowerCase().includes('example') && liveResult.content.length > 50) {
            console.log('\n✅ [PASS] Live Headless Engine traversed and extracted content successfully.');
        } else {
            console.error('\n❌ [FAIL] Live result did not match expected structure.');
        }
    } catch (err) {
        console.error('❌ [FAIL] Live traversal encountered error:', err);
    }

    console.log('\n🎉 Test Suite Completed.');
}

runTests().catch(console.error);
