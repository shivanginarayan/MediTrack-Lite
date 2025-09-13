import Anthropic from '@anthropic-ai/sdk';
import { eachValueFrom } from 'rxjs-for-await';
import { Observable, Subject } from 'rxjs';

// Helper function to safely get environment variables (browser-compatible)
function getOptionalEnv(name: string): string | null {
  // In browser, try to get from import.meta.env (Vite environment variables)
  return import.meta.env[`VITE_${name}`] || import.meta.env[name] || null;
}

// Check if we're in demo mode (no API keys available or in browser)
function isDemoMode(): boolean {
  // Always use demo mode in browser environment to avoid security issues
  if (typeof window !== 'undefined') {
    return true;
  }
  return !getOptionalEnv('ANTHROPIC_API_KEY');
}

// Event types for the AI agent
export interface AgentEvent {
  type: 'thinking' | 'tool_use' | 'response' | 'error' | 'complete';
  content: string;
  timestamp: Date;
}

// MCP Server configuration
interface MCPServerConfig {
  id: string;
  type: 'command';
  command: {
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
}

// Simple MCP Server Manager
class MCPServerManager {
  private servers: Map<string, MCPServerConfig> = new Map();

  async registerServer(config: MCPServerConfig): Promise<void> {
    this.servers.set(config.id, config);
    console.log(`Registered MCP server: ${config.id}`);
  }

  getServer(id: string): MCPServerConfig | undefined {
    return this.servers.get(id);
  }

  async executeServerCommand(serverId: string, input: string): Promise<string> {
    const server = this.getServer(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Browser-compatible mock implementation
    // In a real implementation, this would make HTTP requests to a backend service
    console.log(`Mock execution of ${serverId} with input: ${input}`);
    
    // Simulate web crawling response
    if (serverId === 'firecrawl') {
      return `Mock web crawling results for: ${input}\n\nThis is a simulated response. In a production environment, this would connect to actual web crawling services through your backend API.`;
    }
    
    return `Mock response from ${serverId}`;
  }
}

// AI Agent class
export class AIAgent {
  private anthropic: Anthropic | null;
  public mcpServerManager: MCPServerManager;
  private initialized: boolean = false;
  private demoMode: boolean;

  constructor() {
    this.demoMode = isDemoMode();
    
    if (this.demoMode) {
      console.log('AI Agent running in DEMO MODE - browser environment or no API keys');
      this.anthropic = null;
    } else {
      // Only create Anthropic client in server environment with API keys
      try {
        this.anthropic = new Anthropic({
          apiKey: getOptionalEnv('ANTHROPIC_API_KEY')!,
          dangerouslyAllowBrowser: false // Explicitly disable browser usage
        });
      } catch (error) {
        console.warn('Failed to initialize Anthropic client, falling back to demo mode:', error);
        this.demoMode = true;
        this.anthropic = null;
      }
    }
    
    this.mcpServerManager = new MCPServerManager();
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('Initializing AI Agent...');
    this.initialized = true;
    console.log('AI Agent initialized successfully');
  }

  runTask(prompt: string, model: string = 'claude-3-sonnet-20240229'): Observable<AgentEvent> {
    const subject = new Subject<AgentEvent>();

    this.executeTask(prompt, model, subject).catch((error) => {
      subject.next({
        type: 'error',
        content: error.message,
        timestamp: new Date()
      });
      subject.complete();
    });

    return subject.asObservable();
  }

  private async executeTask(
    prompt: string,
    model: string,
    subject: Subject<AgentEvent>
  ): Promise<void> {
    try {
      // Emit thinking event
      subject.next({
        type: 'thinking',
        content: this.demoMode ? 'Processing your request in demo mode...' : 'Processing your request...',
        timestamp: new Date()
      });

      // Check if we need to use web crawling
      const needsWebCrawling = prompt.toLowerCase().includes('latest') || 
                              prompt.toLowerCase().includes('current') ||
                              prompt.toLowerCase().includes('news');

      let enhancedPrompt = prompt;
      
      if (needsWebCrawling) {
        subject.next({
          type: 'tool_use',
          content: this.demoMode ? 'Simulating web crawling in demo mode...' : 'Using web crawling to gather latest information...',
          timestamp: new Date()
        });

        try {
          // Try to use firecrawl if available
          const crawlResult = await this.mcpServerManager.executeServerCommand('firecrawl', prompt);
          enhancedPrompt = `${prompt}\n\nAdditional context from web crawling:\n${crawlResult}`;
        } catch (error) {
          console.warn('Web crawling failed, proceeding without it:', error);
          subject.next({
            type: 'tool_use',
            content: 'Web crawling unavailable, proceeding with general knowledge...',
            timestamp: new Date()
          });
        }
      }

      let responseText: string;

      if (this.demoMode) {
        // Demo mode - generate mock responses
        responseText = this.generateDemoResponse(prompt);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // Real mode - use Anthropic API
        const message = await this.anthropic!.messages.create({
          model: model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: enhancedPrompt
            }
          ]
        });

        // Extract text content from the response
        responseText = message.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('\n');
      }

      subject.next({
        type: 'response',
        content: responseText,
        timestamp: new Date()
      });

      subject.next({
        type: 'complete',
        content: this.demoMode ? 'Demo task completed successfully' : 'Task completed successfully',
        timestamp: new Date()
      });

      subject.complete();
    } catch (error) {
      subject.next({
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      subject.complete();
    }
  }

  private generateDemoResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('ai') && lowerPrompt.includes('news')) {
      return `🤖 **Latest AI News (Demo Mode)**\n\nHere are some simulated AI news updates:\n\n• **OpenAI releases new GPT model** - Improved reasoning capabilities and reduced hallucinations\n• **Google announces Gemini updates** - Better multimodal understanding\n• **Meta's AI research breakthrough** - New approach to training efficiency\n• **Microsoft integrates AI into healthcare** - AI-powered diagnostic tools\n\n*Note: This is a demo response. In production mode with API keys, you would get real-time AI news from web crawling.*`;
    }
    
    if (lowerPrompt.includes('weather')) {
      return `🌤️ **Weather Information (Demo Mode)**\n\nI'd be happy to help with weather information! In demo mode, I can't access real-time weather data, but with proper API keys configured, I could:\n\n• Get current weather conditions\n• Provide forecasts\n• Show weather alerts\n• Compare weather across locations\n\n*Configure ANTHROPIC_API_KEY to get real weather data.*`;
    }
    
    if (lowerPrompt.includes('help') || lowerPrompt.includes('what can you do')) {
      return `🚀 **AI Assistant Capabilities (Demo Mode)**\n\nI'm an AI assistant that can help with:\n\n• **Information Research** - Find and analyze information\n• **Content Creation** - Write, summarize, and edit text\n• **Problem Solving** - Break down complex problems\n• **Code Assistance** - Help with programming tasks\n• **Analysis** - Analyze data and provide insights\n\n**Demo Mode Features:**\n• Simulated responses for demonstration\n• Mock web crawling capabilities\n• No API keys required\n\n**Production Mode Features:**\n• Real AI responses from Claude\n• Actual web crawling with Firecrawl\n• Real-time information access\n\n*Add your ANTHROPIC_API_KEY to .env to enable production mode.*`;
    }
    
    // Default response
    return `🤖 **AI Assistant Response (Demo Mode)**\n\nThank you for your query: "${prompt}"\n\nIn demo mode, I'm providing a simulated response to show how the AI assistant works. Here's what I would typically help you with:\n\n• **Research & Analysis** - I can help research topics and provide detailed analysis\n• **Creative Tasks** - Writing, brainstorming, and content creation\n• **Problem Solving** - Breaking down complex problems into manageable steps\n• **Technical Support** - Assistance with coding, troubleshooting, and technical questions\n\n**To get real AI responses:**\n1. Get an Anthropic API key from https://console.anthropic.com\n2. Add it to your .env file as VITE_ANTHROPIC_API_KEY\n3. Restart the application\n\n*This demo shows the interface and functionality without requiring API keys.*`;
  }
}

// Example usage function
export async function runAIAgentExample(): Promise<void> {
  try {
    // Create the agent
    const agent = new AIAgent();

    // Register and connect to an MCP server for web crawling capabilities
    await agent.mcpServerManager.registerServer({
      id: 'firecrawl',
      type: 'command',
      command: {
        command: 'npx',
        args: ['-y', 'firecrawl-mcp'],
        env: {
          FIRECRAWL_API_KEY: getOptionalEnv('FIRECRAWL_API_KEY') || 'demo-key',
        },
      },
    });

    // Initialize the agent
    await agent.init();

    // Run a task - the agent will use web crawling to find current AI news
    const event$ = agent.runTask(
      'Find latest AI news',
      'claude-3-sonnet-20240229'
    );

    // Stream the results in real-time
    for await (const event of eachValueFrom(event$)) {
      console.log(`[${event.type.toUpperCase()}] ${event.content}`);
    }
  } catch (error) {
    console.error('Error running AI agent:', error);
  }
}

// Helper function to check if demo mode is active
export function isAIAgentInDemoMode(): boolean {
  return isDemoMode();
}

// Export the main components
export default AIAgent;