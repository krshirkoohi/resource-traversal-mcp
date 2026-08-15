<img width="1200" height="896" alt="image" src="https://github.com/user-attachments/assets/5970123c-5114-4e28-937c-646da1131106" />

# Resource Traversal MCP - The Universal Web Key

**Vision:** Transforming static pointers into live cognitive portals.

**Developer:** Kavia Shirkoohi ([shirkoohi.com](https://shirkoohi.com))

## What It Does

The Resource Traversal MCP gives your AI "eyes" and "keys" across the authenticated web. In a modern workflow, your **Command Centre (Notion / Notes) provides Structure**, your **Cloud & Repositories provide Data**, and this engine is the **Connective Tissue** that allows AI agents to traverse and inspect private web resources on demand.

Instead of relying on fragile or restricted third-party APIs, it uses **Native Chromium Headless Architecture** to inherit your existing browser sessions. If you can see it in your browser, your AI can now "traverse" it as a first-class observer.

## Core Breakthroughs

1. **Unified Auth Layer:** AI inherits your permissions via a local "Master Profile" (`.auth/` folder). No API keys or developer accounts required.
2. **Native Chromium Stealth:** Uses `--headless=new` with hardware-locked OS encryption (macOS Keychain / Windows DPAPI) to remain undetectable by CloudFlare and advanced bot detection.
3. **Temporal Navigation:** Specialised scrolling logic for SPAs (Single Page Applications) to capture full conversation histories, not just the visible viewport.
4. **Universal Portals:** Verified success across high-friction targets including **Notion, Slack, Discord, Linear, Jira, Gemini, ChatGPT, and Google Workspace**.
5. **Intelligent Fallback:** Any web link, documentation portal, or article is automatically extracted with noise, navigation menus, and cookie banners filtered out.

## Prerequisites

Before starting, ensure you have the following installed on your local machine:
- **Bun:** Fast JavaScript runtime (`curl -fsSL https://bun.sh/install | bash`).
- **Google Chrome:** Required for the Native Headless engine.

## Quick Start

### 1. Install dependencies
```bash
bun install
```

### 2. The Universal Auth Key (One-time login)
Unlock any site for your AI in seconds:
```bash
bun run auth [URL]
```
*Example:* `bun run auth https://app.notion.com` or `bun run auth https://chatgpt.com`  
Log in manually in the window that opens, then close the browser. Your session is now hardware-locked to your local machine for AI reuse.

### 3. Add to Antigravity / Claude / Cursor / Windsurf
Point your MCP client configuration to this directory or its `index.ts` entrypoint.

## Tools

| Tool | Description |
|------|-------------|
| `traverse_resource` | Fetch content from *any* authenticated or public URL (Notion, ChatGPT, Slack, Gemini, etc.) |
| `check_auth` | Verify if a local "Master Profile" session exists |

## Supported Portals & Extractors

| Category | Service | Capability |
|:---|:---|:---|
| **Workspaces & Notes** | ✅ **Notion** (`notion.so`, `notion.site`, `app.notion.com`), Google Docs, NotebookLM | Structural block formatting (headings, lists, toggles, callouts) |
| **AI Chats** | ✅ Gemini, ChatGPT, Grok | Multi-turn dialogue extraction with deep history scroll-back |
| **Communities & Comms** | ✅ Discord, Slack | Archives, channel threads, direct messages, real-time context |
| **Knowledge & Bookmarks** | ✅ GitHub (Repos), 🧪 Raindrop.io (Experimental) | Repository code/issues, bookmark collections |
| **Universal Fallback** | ✅ **Any Web URL / Article / Documentation** | Intelligent semantic parsing with automated boilerplate & cookie cleanup |

## 🏗️ Extensibility: Modular Extraction Framework

The project is designed as a **Modular Ecosystem**. You can easily add support for any new site by contributing a "Site Adapter" to the `lib/extractors.ts` library. 

- **Plug-and-Play:** Adding a new portal takes only a few lines of code.
- **AI-Driven Maintenance:** The included `SYSTEM_PROMPTS.md` contains a **Self-Healing Extraction Strategy**, allowing your AI agent to autonomously troubleshoot broken selectors and propose code updates to the framework.
- **Universal Fallback:** If a specialized adapter doesn't exist, the tool utilizes an enhanced **Generic Scrape** to ensure no link is a dead end.

## 🔒 Privacy & Security

- **Local-First:** Your credentials and cookies never leave your machine.
- **Zero-Cloud:** No third-party servers. Data flows directly from the web to your local AI.
- **Consensual Observation:** The AI only enters the portals you explicitly unlock via the `auth` tool.

## ⚠️ Potential Limitations

1. **Shadow DOM & Canvases:** Some applications (notably **Google Docs**) do not store text in the standard DOM; they paint text on Canvas elements. For Google Docs, dedicated API integrations are recommended where full raw fidelity is critical.
2. **Brittle Selectors:** Web apps update their layouts periodically. If a service changes its internal class names, a specialised extractor falls back to the generic reader until updated.
3. **Session Expiry:** Cookies eventually expire. If the AI hits a login wall, it will proactively provide instructions to run `bun run auth [URL]` to refresh your session.
4. **Cold Start Latency (Session Hydration):** When first launching a traversal for heavy SPAs like **Notion**, **Discord**, or **Slack**, there is an initialization delay (30-60 seconds) while Native Chromium loads the hardware-locked OS profile and hydrates the DOM.

---
