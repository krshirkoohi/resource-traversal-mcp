#!/usr/bin/env bun
/**
 * Resource Traversal MCP Server
 * 
 * An MCP server that traverses authenticated web resources using
 * headless browser sessions with persistent cookies.
 * 
 * Tools:
 * - traverse_resource: Fetch content from an authenticated URL
 * - check_auth: Check if an authenticated session exists
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { hasAuthSession, fetchWithExtractor, fetchAuthenticated } from './lib/browser';
import { getExtractor, detectService } from './lib/extractors';

// Initialize MCP Server
const server = new Server(
    {
        name: 'resource-traversal-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'traverse_resource',
                description: 'Fetch content from an authenticated web resource (e.g., Gemini chat, Google Doc, NotebookLM). Requires prior authentication via `bun run auth`.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'The URL of the resource to traverse (e.g., https://gemini.google.com/app/xyz)',
                        },
                        raw: {
                            type: 'boolean',
                            description: 'If true, return raw page text without service-specific extraction (default: false)',
                        },
                    },
                    required: ['url'],
                },
            },
            {
                name: 'check_auth',
                description: 'Check if an authenticated browser session exists',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'traverse_resource': {
                const url = args?.url as string;
                const raw = args?.raw as boolean | undefined;

                if (!url) {
                    return {
                        content: [{ type: 'text', text: 'Error: URL is required' }],
                        isError: true,
                    };
                }

                if (!hasAuthSession()) {
                    return {
                        content: [{
                            type: 'text',
                            text: '❌ No authenticated session found.\n\nTo set up authentication, run:\n```\ncd Projects/resource-traversal-mcp && bun run auth\n```\n\nThis will open a browser for you to log in to Google.',
                        }],
                        isError: true,
                    };
                }

                const service = detectService(url);
                let result;

                try {
                    if (raw || !service) {
                        result = await fetchAuthenticated(url);
                    } else {
                        const extractor = getExtractor(url);
                        result = await fetchWithExtractor(url, extractor);
                    }
                } catch (fetchError) {
                    const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
                    
                    // Detect session expiry or login walls
                    if (errorMsg.includes('Session expired') || errorMsg.includes('Sign in') || errorMsg.includes('login')) {
                        return {
                            content: [{
                                type: 'text',
                                text: `🔐 **Session Expired or Auth Required**\n\nThe AI hit a login wall at: ${url}\n\n**Action Required:**\nRun the Universal Auth Key to refresh your session:\n\`\`\`bash\ncd Projects/resource-traversal-mcp && bun run auth ${url}\n\`\`\``,
                            }],
                            isError: true,
                        };
                    }
                    throw fetchError; // Re-throw if it's a different kind of error
                }

                const serviceLabel = service ? ` (${service})` : '';
                const output = [
                    `# ${result.title}${serviceLabel}`,
                    '',
                    `**Source:** ${url}`,
                    '',
                    '---',
                    '',
                    result.content,
                ].join('\n');

                return {
                    content: [{ type: 'text', text: output }],
                };
            }

            case 'check_auth': {
                const hasAuth = hasAuthSession();

                if (hasAuth) {
                    return {
                        content: [{
                            type: 'text',
                            text: '✅ Authenticated session found.\n\nYou can use `traverse_resource` to fetch content from authenticated URLs.',
                        }],
                    };
                } else {
                    return {
                        content: [{
                            type: 'text',
                            text: '❌ No authenticated session found.\n\nTo set up authentication, run:\n```\ncd Projects/resource-traversal-mcp && bun run auth\n```',
                        }],
                    };
                }
            }

            default:
                return {
                    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: 'text', text: `❌ Error: ${errorMessage}` }],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Resource Traversal MCP server running on stdio');
}

main().catch(console.error);
