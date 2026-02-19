#!/usr/bin/env bun
/**
 * Universal Auth Setup Script
 * 
 * Launches a headed browser for the user to log in to ANY service.
 * Session cookies are saved to .auth/chromium-profile/ for reuse.
 * 
 * Usage: 
 *   bun run auth               (Google login by default)
 *   bun run auth https://url   (Specific service login)
 */

import { launchForAuth, hasAuthSession } from '../lib/browser';

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║        🌍 Resource Traversal — Universal Auth Key        ║');
    console.log('║           Inherit Your Browser Permissions               ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    const urlArg = process.argv[2];
    let startUrl = urlArg || 'https://accounts.google.com';

    if (hasAuthSession()) {
        console.log('🛡️  Existing session found. This will update your "Master Profile".');
    } else {
        console.log('🆕 Creating a new "Master Profile" for the first time.');
    }

    console.log(`🌐 Target: ${startUrl}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' 1. A Chrome browser window will open.');
    console.log(' 2. Log in to your account (Google, Discord, Ionos, etc.).');
    console.log(' 3. Once logged in, simply CLOSE the browser.');
    console.log(' 4. Your AI will then inherit those same "eyes" and "keys".');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    await launchForAuth(startUrl);

    console.log('');
    console.log('✨ Success! Your Universal Auth Key is now updated.');
    console.log('   The AI can now "traverse" any authenticated resource at:');
    console.log(`   ${new URL(startUrl).origin}`);
    console.log('');
    console.log('🚀 Try it now: traverse_resource(url: "' + startUrl + '")');
    console.log('');
}

main().catch((error) => {
    console.error('❌ Universal Auth Key setup failed:', error.message);
    process.exit(1);
});
