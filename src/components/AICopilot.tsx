import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Code2, Sparkles, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  timestamp?: string;
}

export const AICopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date().toISOString();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp }]);
    setIsLoading(true);

    try {
      // Intelligent action detection
      let action: 'diagnose' | 'fix' | 'orchestrate' | 'generate_project' | 'code_review' | undefined;
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes('fix') || lowerInput.includes('repair') || lowerInput.includes('solve') || lowerInput.includes('debug')) {
        action = 'fix';
      } else if (lowerInput.includes('review') || lowerInput.includes('analyze') || lowerInput.includes('check code')) {
        action = 'code_review';
      } else if (lowerInput.includes('orchestrate') || lowerInput.includes('coordinate') || lowerInput.includes('run bots')) {
        action = 'orchestrate';
      } else if (lowerInput.includes('generate project') || lowerInput.includes('create project') || lowerInput.includes('new project')) {
        action = 'generate_project';
      } else {
        action = 'diagnose';
      }

      // Enhanced context gathering
      const context = {
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp,
        screenSize: { width: window.innerWidth, height: window.innerHeight }
      };

      const { data, error } = await supabase.functions.invoke('ai-engineer', {
        body: { 
          message: userMessage,
          action,
          context,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }
      });

      if (error) throw error;

      const assistantMessage = data.response || 'Task completed!';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage,
        action,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: '✨ AI Code Space',
        description: `${action.replace('_', ' ').charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')} completed`
      });
    } catch (error) {
      console.error('AI Engineer error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary via-accent to-primary hover:scale-110 transition-all duration-300 z-50 animate-pulse"
        size="icon"
      >
        <div className="relative">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
          <Code2 className="h-4 w-4 text-primary-foreground absolute -bottom-1 -right-1" />
        </div>
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[480px] h-[700px] flex flex-col shadow-2xl z-50 bg-card/95 backdrop-blur-xl border-2 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Terminal className="h-6 w-6 text-primary" />
            <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Code Space</h3>
            <p className="text-xs text-muted-foreground">Natural language debugging & development</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background/50 to-background">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8 space-y-4">
            <div className="mb-4">
              <Code2 className="h-12 w-12 mx-auto text-primary mb-2" />
              <p className="text-base font-bold text-foreground">AI Code Space Ready</p>
            </div>
            <p className="text-xs text-muted-foreground px-4">
              I understand natural language and can help you with your entire codebase
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mt-4">
              <Badge variant="outline" className="justify-start p-2 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Debug issues
              </Badge>
              <Badge variant="outline" className="justify-start p-2 text-xs">
                <Code2 className="h-3 w-3 mr-1" /> Review code
              </Badge>
              <Badge variant="outline" className="justify-start p-2 text-xs">
                <Terminal className="h-3 w-3 mr-1" /> Fix errors
              </Badge>
              <Badge variant="outline" className="justify-start p-2 text-xs">
                <MessageCircle className="h-3 w-3 mr-1" /> Explain logic
              </Badge>
            </div>
            <p className="mt-6 text-xs italic text-muted-foreground px-4">
              Try: "Debug the video rendering" or "Review my authentication code"
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                  : 'bg-secondary/80 backdrop-blur text-foreground border border-border'
              }`}
            >
              {msg.action && msg.role === 'assistant' && (
                <Badge variant="secondary" className="mb-2 text-xs">
                  {msg.action.replace('_', ' ')}
                </Badge>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
            {msg.timestamp && (
              <span className="text-[10px] text-muted-foreground mt-1 px-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you need help with..."
            className="resize-none bg-background border-border focus:border-primary transition-colors"
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-br from-primary via-accent to-primary hover:scale-105 transition-all shadow-lg h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by advanced AI • Context-aware • Natural language
        </p>
      </div>
    </Card>
  );
};
