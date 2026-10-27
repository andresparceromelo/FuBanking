import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

export interface MCPPlaywrightOptions {
  headless?: boolean;
  viewport?: string;
  outputDir?: string;
}

export class PlaywrightMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  constructor(private options: MCPPlaywrightOptions = {}) {}

  async connect(): Promise<void> {
    const cliPath = path.resolve('node_modules/@playwright/mcp/cli.js');
    const args = [cliPath];

    if (this.options.headless !== false) {
      args.push('--headless');
    }
    if (this.options.viewport) {
      args.push('--viewport-size', this.options.viewport);
    }
    if (this.options.outputDir) {
      args.push('--output-dir', this.options.outputDir);
    }

    this.transport = new StdioClientTransport({
      command: process.execPath,
      args
    });

    this.client = new Client(
      {
        name: 'fubanking-mcp-playwright-client',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    await this.client.connect(this.transport);
  }

  async callTool<T = any>(name: string, args: Record<string, any> = {}): Promise<T> {
    if (!this.client) {
      throw new Error('MCP Client is not connected. Call connect() first.');
    }
    const result = await this.client.callTool({
      name,
      arguments: args
    });
    return result as T;
  }

  async navigate(url: string) {
    return this.callTool('browser_navigate', { url });
  }

  async snapshot(options: { depth?: number; boxes?: boolean; filename?: string } = {}) {
    return this.callTool('browser_snapshot', options);
  }

  async click(target: string, elementDescription = 'target element') {
    return this.callTool('browser_click', {
      target,
      element: elementDescription
    });
  }

  async type(target: string, text: string, options: { slowly?: boolean; submit?: boolean } = {}) {
    return this.callTool('browser_type', {
      target,
      text,
      element: `Input field ${target}`,
      ...options
    });
  }

  async takeScreenshot(filename: string, fullPage = false) {
    return this.callTool('browser_take_screenshot', {
      filename,
      scale: 'css',
      fullPage
    });
  }

  async waitFor(text?: string, timeout?: number) {
    return this.callTool('browser_wait_for', {
      text,
      timeout
    });
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.callTool('browser_close');
      } catch (e) {
        // Ignored on teardown
      }
    }
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.client = null;
  }
}
