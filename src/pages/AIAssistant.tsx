import React, { useState, useRef, useEffect } from 'react';
import { AIAgent, isAIAgentInDemoMode } from '../services/aiAgent';
import { eachValueFrom } from 'rxjs-for-await';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, Send, Bot, User, AlertCircle, CheckCircle, Zap, Info } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'thinking' | 'tool_use' | 'response' | 'error' | 'complete';
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize AI Agent
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const aiAgent = new AIAgent();
        await aiAgent.init();
        setAgent(aiAgent);
        setIsInitialized(true);
        
        const isDemoMode = isAIAgentInDemoMode();
        
        if (isDemoMode) {
          setMessages([{
            id: Date.now().toString(),
            type: 'system',
            content: '🎭 **AI Assistant - Demo Mode**\n\nWelcome! The AI Assistant is running in demo mode with simulated responses. This lets you explore the interface and functionality without requiring API keys.\n\n**To enable full AI capabilities:**\n1. Get an Anthropic API key from https://console.anthropic.com\n2. Add it to your .env file as `VITE_ANTHROPIC_API_KEY=your_key_here`\n3. Restart the application\n\nTry asking questions to see how the AI assistant works!',
            timestamp: new Date()
          }]);
        } else {
          setMessages([{
            id: Date.now().toString(),
            type: 'system',
            content: '🤖 **AI Assistant - Production Mode**\n\nAI Assistant is ready with full capabilities! I can help you with medication management, healthcare questions, and provide real-time insights about your MediTrack data.',
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Failed to initialize AI agent:', error);
        setMessages([{
          id: Date.now().toString(),
          type: 'system',
          content: `❌ Failed to initialize AI Assistant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }]);
      }
    };

    initializeAgent();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agent || !isInitialized || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'thinking'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Run the AI task
      const event$ = agent.runTask(userMessage.content);
      
      for await (const event of eachValueFrom(event$)) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: event.type === 'response' ? event.content : msg.content,
              status: event.type as any,
              timestamp: event.timestamp
            };
          }
          return msg;
        }));

        // Log important events
        if (event.type === 'tool_use') {
          console.log('Tool use:', event.content);
        } else if (event.type === 'error') {
          console.error('AI Error:', event.content);
        }
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        type: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'thinking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'tool_use':
        return <Zap className="h-4 w-4" />;
      case 'response':
        return <Bot className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'thinking':
        return <Badge variant="secondary">Thinking...</Badge>;
      case 'tool_use':
        return <Badge variant="outline">Using Tools</Badge>;
      case 'response':
        return <Badge variant="default">Responding</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'complete':
        return <Badge variant="secondary">Complete</Badge>;
      default:
        return null;
    }
  };

  const suggestedQuestions = [
    "How can I improve medication adherence?",
    "What are best practices for medication inventory management?",
    "Explain the importance of proper medication storage",
    "How do I set up medication reminders effectively?",
    "What should I know about drug interactions?"
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Assistant
            {isAIAgentInDemoMode() && (
              <Badge variant="outline" className="ml-2">
                <Info className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isAIAgentInDemoMode() 
              ? "Explore AI capabilities with simulated responses - no API keys required"
              : "Get intelligent insights and assistance for your medication management needs"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 pr-4 mb-4 overflow-y-auto max-h-96">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {message.type === 'system' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          getStatusIcon(message.status)
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : message.type === 'system'
                          ? 'bg-muted'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.status && getStatusBadge(message.status) && (
                        <div className="mt-2">
                          {getStatusBadge(message.status)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && isInitialized && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isInitialized ? "Ask me anything about medication management..." : "AI Assistant is initializing..."}
              disabled={!isInitialized || isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || !isInitialized || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;