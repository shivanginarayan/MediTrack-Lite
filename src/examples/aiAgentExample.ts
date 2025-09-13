import { AIAgent, runAIAgentExample } from '../services/aiAgent';
import { eachValueFrom } from 'rxjs-for-await';

/**
 * Example demonstrating how to use the AI Agent in the MediTrack application
 */

// Example 1: Basic AI Agent usage
export async function basicAIAgentExample(): Promise<void> {
  try {
    console.log('=== Basic AI Agent Example ===');
    
    const agent = new AIAgent();
    await agent.init();

    // Simple query without web crawling
    const event$ = agent.runTask(
      'Explain the importance of medication adherence in healthcare',
      'claude-3-sonnet-20240229'
    );

    for await (const event of eachValueFrom(event$)) {
      console.log(`[${event.timestamp.toISOString()}] ${event.type.toUpperCase()}: ${event.content}`);
    }
  } catch (error) {
    console.error('Error in basic AI agent example:', error);
  }
}

// Example 2: AI Agent with web crawling for latest information
export async function webCrawlingAIAgentExample(): Promise<void> {
  try {
    console.log('\n=== Web Crawling AI Agent Example ===');
    
    const agent = new AIAgent();
    
    // Register firecrawl server for web crawling
    await agent.mcpServerManager.registerServer({
      id: 'firecrawl',
      type: 'command',
      command: {
        command: 'npx',
        args: ['-y', 'firecrawl-mcp'],
        env: {
          FIRECRAWL_API_KEY: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
        },
      },
    });

    await agent.init();

    // Query that will trigger web crawling
    const event$ = agent.runTask(
      'Find latest news about digital health and medication management technologies',
      'claude-3-sonnet-20240229'
    );

    for await (const event of eachValueFrom(event$)) {
      console.log(`[${event.timestamp.toISOString()}] ${event.type.toUpperCase()}: ${event.content}`);
    }
  } catch (error) {
    console.error('Error in web crawling AI agent example:', error);
  }
}

// Example 3: Healthcare-specific AI queries
export async function healthcareAIAgentExample(): Promise<void> {
  try {
    console.log('\n=== Healthcare AI Agent Example ===');
    
    const agent = new AIAgent();
    await agent.init();

    const healthcareQueries = [
      'What are the best practices for medication inventory management in healthcare facilities?',
      'How can AI help improve patient medication adherence?',
      'What are the key features of an effective medication tracking system?'
    ];

    for (const query of healthcareQueries) {
      console.log(`\n--- Query: ${query} ---`);
      
      const event$ = agent.runTask(query, 'claude-3-sonnet-20240229');
      
      for await (const event of eachValueFrom(event$)) {
        if (event.type === 'response') {
          console.log(`Response: ${event.content}`);
        } else {
          console.log(`[${event.type.toUpperCase()}] ${event.content}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in healthcare AI agent example:', error);
  }
}

// Main function to run all examples
export async function runAllAIAgentExamples(): Promise<void> {
  console.log('Starting AI Agent Examples for MediTrack...');
  
  // Check if required environment variables are set
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    console.error('❌ VITE_ANTHROPIC_API_KEY is not set. Please update your .env file with a valid API key.');
    console.log('To get an API key:');
    console.log('1. Visit https://console.anthropic.com/');
    console.log('2. Create an account or sign in');
    console.log('3. Generate an API key');
    console.log('4. Update the VITE_ANTHROPIC_API_KEY in your .env file');
    return;
  }

  try {
    await basicAIAgentExample();
    await healthcareAIAgentExample();
    
    // Only run web crawling example if FIRECRAWL_API_KEY is set
    if (import.meta.env.VITE_FIRECRAWL_API_KEY && import.meta.env.VITE_FIRECRAWL_API_KEY !== 'your_firecrawl_api_key_here') {
      await webCrawlingAIAgentExample();
    } else {
      console.log('\n⚠️  Skipping web crawling example - VITE_FIRECRAWL_API_KEY not set');
      console.log('To enable web crawling:');
      console.log('1. Visit https://firecrawl.dev/');
      console.log('2. Sign up for an account');
      console.log('3. Get your API key');
      console.log('4. Update the VITE_FIRECRAWL_API_KEY in your .env file');
    }
    
    console.log('\n✅ All AI Agent examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running AI agent examples:', error);
  }
}

// Export the main example function from the original code
export { runAIAgentExample };