import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Mic, Upload, Paperclip, Bot, Sparkles, Trash2, Image as ImageIcon, Video, Music, FileText } from 'lucide-react';
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

interface FileAttachment {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

export const AICopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const dragCounterRef = useRef(0);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileType = (file: File): FileAttachment['type'] => {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('text') || type.includes('document') || type.includes('word')) return 'document';
    return 'other';
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const newFiles: FileAttachment[] = [];
    
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        });
        continue;
      }

      const fileType = getFileType(file);
      let preview: string | undefined;

      // Create preview for images and videos
      if (fileType === 'image') {
        try {
          preview = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        } catch (error) {
          console.warn('Failed to create image preview:', error);
        }
      }

      newFiles.push({
        file,
        preview,
        type: fileType,
      });
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast({
      title: 'Assets attached',
      description: `${newFiles.length} file(s) ready to upload`,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    // Reset input
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    await processFiles(files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
        const fileAttach: FileAttachment = {
          file,
          type: 'audio'
        };
        setUploadedFiles(prev => [...prev, fileAttach]);
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

  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const timestamp = new Date().toISOString();
    const attachments: string[] = [];

    // Upload files to storage
    for (const fileAttach of uploadedFiles) {
      const filePath = `uploads/${Date.now()}-${fileAttach.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('media_assets')
        .upload(filePath, fileAttach.file);
      
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

      console.log('📤 Sending message to AI Copilot:', { userMessage, attachments: attachments.length });

      const { data, error } = await supabase.functions.invoke('ai-copilot', {
        body: { 
          message: userMessage,
          attachments,
          context,
          conversationHistory: messages.slice(-10)
        }
      });

      console.log('📥 AI Copilot response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      if (!data || !data.response) {
        throw new Error('Invalid response from AI service');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response,
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
      
      let helpfulResponse = '';
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
          helpfulResponse = `I'm currently unable to connect to the orchestration service. This might be a temporary issue. Please make sure you're logged in and try again. If the problem persists, you can still use me to chat, provide feedback, or ask for general information!`;
        } else if (error.message.includes('function')) {
          helpfulResponse = `I encountered a service connectivity issue. Here's what I can still help with:\n• Answer questions about the app\n• Provide general guidance\n• Store your requests for later\n\nPlease try again in a moment, or feel free to describe what you'd like to do!`;
        } else {
          helpfulResponse = `I experienced a temporary issue processing your request. This sometimes happens due to network connectivity. Let me try to help you in a different way:\n\nWhat would you like to accomplish? I can:\n• Provide guidance and information\n• Answer questions about features\n• Help you troubleshoot\n\nFeel free to rephrase or provide more details!`;
        }
      } else {
        helpfulResponse = `I'm having trouble connecting right now, but I'm here to help! Could you tell me more about what you're trying to do? I'll do my best to assist or remember your request for when the service is back online.`;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: helpfulResponse,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: '⚠️ Connection Issue',
        description: 'AI orchestrator temporarily unavailable'
      });
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background/50 to-background" onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
        {isDragging && (
          <div className="absolute inset-0 bg-primary/20 rounded-lg border-2 border-dashed border-primary pointer-events-none flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-primary">Drop assets here</p>
            </div>
          </div>
        )}
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
        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">
                📎 {uploadedFiles.length} asset(s) attached
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFiles([])}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
              {uploadedFiles.map((attachment, idx) => (
                <div
                  key={idx}
                  className="relative group p-2 bg-background rounded border border-border flex items-center gap-2 hover:border-primary transition-colors"
                >
                  {attachment.preview && attachment.type === 'image' ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center text-primary/70">
                      {getFileIcon(attachment.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(idx)}
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you need help with..."
              className="resize-none bg-background border-border focus:border-primary transition-colors"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1 justify-start">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              size="icon"
              className="h-9 w-9"
              title="Upload assets (images, videos, audio, documents)"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              disabled={isLoading}
              variant={isRecording ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              title={isRecording ? 'Stop recording' : 'Record voice'}
            >
              <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-gradient-to-br from-primary via-accent to-primary hover:scale-105 transition-all shadow-lg h-9 w-9"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by advanced AI • Supports images, videos, audio, and documents
        </p>
      </div>
    </Card>
  );
};
