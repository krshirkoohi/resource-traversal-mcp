# Resource Traversal MCP - The Universal Web Key

**Vision:** Transforming static pointers into live cognitive portals.

**Developer:** Kavia Shirkoohi | [shirkoohi.com](https://shirkoohi.com)

## What It Does

The Resource Traversal MCP gives your AI "eyes" and "keys" on the authenticated web. Instead of relying on fragile or restricted APIs, it uses **Native Chromium Headless Architecture** to inherit your existing browser sessions.

If you can see it in your browser (Gemini, ChatGPT, Discord, Slack, GitHub, etc.), your AI can now "traverse" it as a first-class observer.

## Core Breakthroughs

1.  **Unified Auth Layer:** AI inherits your permissions via a local "Master Profile" (.auth/ folder). No API keys or developer accounts required.
2.  **Native Chromium Stealth:** Uses `--headless=new` with hardware-locked OS encryption (macOS Keychain / Windows DPAPI) to remain undetectable by CloudFlare and advanced bot detection.
3.  **Temporal Navigation:** Specialised scrolling logic for SPAs (Single Page Applications) to capture full conversation histories, not just the visible screen.
4.  **Autonomous Barrier Handling:** Built-in logic to detect and bypass **Cookie Consent Walls** and **Slack/App Redirects** automatically, ensuring the AI never gets stuck at a "digital gate."
5.  **Implicit Contextual Portals:** Designed to treat *any* URL in Tana as a live expansion of the AI's memory.

## Prerequisites

Before starting, ensure you have the following installed on your local machine:
- **Bun:** The fast JavaScript runtime (`curl -fsSL https://bun.sh/install | bash`).
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
*Example:* `bun run auth https://chatgpt.com`  
Log in manually in the window that opens, then close the browser. Your session is now hardware-locked to your local machine for AI reuse.

### 3. Add to Tana / Claude / Cursor
Point your MCP client to the project's `index.ts` file.

## Tools

| Tool | Description |
|------|-------------|
| `traverse_resource` | Fetch content from *any* authenticated URL (Gemini, ChatGPT, Slack, etc.) |
| `check_auth` | Verify if a local "Master Profile" session exists |

## Supported Portals (Verified)

| Service | Capability |
|---------|------------|
| **AI Chats** | ✅ Gemini, ChatGPT, Grok (Full history scrolling) |
| **Communities** | ✅ Discord, Slack (Archives, Threads, Real-time context) |
| **Knowledge/Misc** | ✅ GitHub (Repos), 🧪 Raindrop.io (Experimental) |
| **Productivity** | ✅ Google Docs, NotebookLM |

## 🏗️ Extensibility: Modular Extraction Framework

The project is designed as a **Modular Ecosystem**. You can easily add support for any new site by contributing a "Site Adapter" to the `lib/extractors.ts` library. 

- **Plug-and-Play:** Adding a new portal takes only a few lines of code.
- **AI-Driven Maintenance:** The included `SYSTEM_PROMPTS.md` contains a **Self-Healing Extraction Strategy**, allowing your AI agent to autonomously troubleshoot broken selectors and propose code updates to the framework.
- **Universal Fallback:** If a specialized adapter doesn't exist, the tool utilizes an intelligent **Generic Scrape** to ensure no link is a dead end.

## 🔒 Privacy & Security

- **Local-First:** Your credentials and cookies never leave your machine.
- **Zero-Cloud:** No third-party servers. Data flows directly from the web to your local AI.
- **Consensual Observation:** The AI only enters the portals you explicitly unlock via the `auth` tool.

## ⚠️ Potential Limitations

While the Resource Traversal MCP is highly advanced, users should be aware of the following "Edge Cases":

1.  **Shadow DOM & Canvases:** Some applications (notably **Google Docs**) do not store their text in the standard DOM. They "paint" text on a Canvas element, making it invisible to standard text extractors.
    - **Pro-Tip:** For the best experience with Google Docs, we recommend connecting them via a dedicated API-based MCP server. Use the Resource Traversal MCP for "hard-to-reach" portals like Gemini, ChatGPT, and Slack where official APIs are limited or non-existent.
2.  **Dynamic Session Persistence:** Certain services (notably **Raindrop.io**) employ unique session-locking mechanisms that occasionally require active user interaction even within the Master Profile. These are currently classified as "Experimental" as we refine the persistence handoff.
3.  **Brittle Selectors:** Web apps update their layouts frequently. If a service like Gemini or Slack changes its internal code, a specialised extractor may return incomplete results until updated. 
    - **Future Roadmap:** We are working on a "Self-Healing" update system that allows the AI to dynamically identify new selectors when a breakage is detected.
3.  **Session Expiry:** Cookies eventually expire. If the AI hits a login wall, it will proactively notify you with instructions to run `bun run auth [URL]` to refresh your "Master Profile."
4.  **Temporal Loading:** Large histories (especially in Slack or long chats) require significant scrolling. The AI is configured to "walk back" through history, but extremely large threads may take several seconds to fully traverse.

## ⚠️ Disclaimer

This tool is intended for personal research and knowledge management. Users are responsible for adhering to the Terms of Service of the websites they traverse.

---
