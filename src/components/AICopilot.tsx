import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Determine action based on keywords
      let action: 'diagnose' | 'fix' | 'orchestrate' | 'generate_project' | undefined;
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes('fix') || lowerInput.includes('repair') || lowerInput.includes('solve')) {
        action = 'fix';
      } else if (lowerInput.includes('orchestrate') || lowerInput.includes('coordinate') || lowerInput.includes('run bots')) {
        action = 'orchestrate';
      } else if (lowerInput.includes('generate project') || lowerInput.includes('create project') || lowerInput.includes('new project')) {
        action = 'generate_project';
      } else {
        action = 'diagnose';
      }

      // Gather context
      const context = {
        currentPage: window.location.pathname,
      };

      const { data, error } = await supabase.functions.invoke('ai-engineer', {
        body: { 
          message: userMessage,
          action,
          context,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      const assistantMessage = data.response || 'Task completed!';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      toast({
        title: 'AI Engineer',
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error processing your request. Please try again or rephrase your question.' 
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 bg-card border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-accent/10 to-primary/10">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <div>
            <h3 className="font-semibold">AI Engineer</h3>
            <p className="text-xs text-muted-foreground">Diagnose, fix, orchestrate & generate</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <p className="mb-2 font-semibold">👋 AI Computer Engineer at your service!</p>
            <p className="text-xs">I can:</p>
            <ul className="text-xs mt-2 space-y-1 text-left max-w-xs mx-auto">
              <li>🔍 <strong>Diagnose</strong> - Analyze issues in your app</li>
              <li>🔧 <strong>Fix</strong> - Repair bugs and errors</li>
              <li>🎯 <strong>Orchestrate</strong> - Coordinate bot workflows</li>
              <li>🚀 <strong>Generate</strong> - Create complete projects</li>
            </ul>
            <p className="mt-4 text-xs italic">Try: "Fix the video rendering issue" or "Generate a new viral campaign project"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-accent to-primary text-primary-foreground'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
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
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="resize-none bg-background border-border"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-accent to-primary hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
