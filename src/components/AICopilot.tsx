import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Mic, Upload, Paperclip, Bot, Sparkles } from 'lucide-react';
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
  attachments?: string[];
  delegatedBots?: string[];
}

export const AICopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.size <= 20 * 1024 * 1024); // 20MB limit
    if (validFiles.length !== files.length) {
      toast({
        title: 'File too large',
        description: 'Some files exceed 20MB limit',
        variant: 'destructive',
      });
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    toast({
      title: 'Files attached',
      description: `${validFiles.length} file(s) ready to upload`,
    });
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setUploadedFiles(prev => [...prev, file]);
        stream.getTracks().forEach(track => track.stop());
        toast({
          title: 'Voice recorded',
          description: 'Voice command captured and ready to send',
        });
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to use voice commands',
        variant: 'destructive',
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date().toISOString();
    const attachments: string[] = [];

    // Upload files to storage
    for (const file of uploadedFiles) {
      const filePath = `uploads/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media_assets')
        .upload(filePath, file);
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('media_assets')
          .getPublicUrl(filePath);
        attachments.push(publicUrl);
      }
    }

    setInput('');
    setUploadedFiles([]);
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage || '(files attached)', 
      timestamp,
      attachments 
    }]);
    setIsLoading(true);

    try {
      const context = {
        currentPage: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp,
        screenSize: { width: window.innerWidth, height: window.innerHeight }
      };

      const { data, error } = await supabase.functions.invoke('ai-copilot', {
        body: { 
          message: userMessage,
          attachments,
          context,
          conversationHistory: messages.slice(-10)
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || 'Task completed!',
        delegatedBots: data.delegatedBots,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: '🎬 AI God-Mode Orchestrator',
        description: data.delegatedBots?.length 
          ? `Delegated to ${data.delegatedBots.length} specialized bots`
          : 'Task completed'
      });
    } catch (error) {
      console.error('AI Orchestrator error:', error);
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
          <Bot className="h-7 w-7 text-primary-foreground" />
          <Sparkles className="h-4 w-4 text-primary-foreground absolute -bottom-1 -right-1" />
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
            <Bot className="h-6 w-6 text-primary" />
            <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              AI God-Mode Orchestrator
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </h3>
            <p className="text-xs text-muted-foreground">App Builder • TV Director • Bot Conductor</p>
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
          <div className="text-center text-muted-foreground text-sm mt-8 space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>
                <Bot className="h-16 w-16 text-primary relative" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">Welcome to God-Mode AI</p>
              <p className="text-xs">I orchestrate specialized bots to build, direct, and create</p>
            </div>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              <p className="font-medium text-xs text-foreground">Try asking:</p>
              <div className="space-y-2">
                <div className="p-2 bg-primary/5 rounded-md text-xs">
                  "Build a user dashboard with analytics"
                </div>
                <div className="p-2 bg-accent/5 rounded-md text-xs">
                  "Create a dramatic confrontation scene"
                </div>
                <div className="p-2 bg-primary/5 rounded-md text-xs">
                  "Generate a viral episode about [topic]"
                </div>
                <div className="p-2 bg-accent/5 rounded-md text-xs">
                  "Redesign the app with modern UI"
                </div>
              </div>
            </div>
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
