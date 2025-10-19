import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, Zap, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Install StoryForge</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Install StoryForge on Your Device
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant access to your AI Reality TV Studio. Works offline, loads fast, feels like a native app.
            </p>
          </div>

          {isInstalled ? (
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Already Installed!</h2>
              <p className="text-muted-foreground">
                StoryForge is already installed on your device. You can access it from your home screen.
              </p>
            </Card>
          ) : (
            <>
              {isInstallable && (
                <Card className="p-8 mb-8 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50">
                  <div className="text-center">
                    <Download className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">Ready to Install</h2>
                    <Button 
                      onClick={handleInstallClick}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Install Now
                    </Button>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="p-6 bg-card border-border">
                  <Zap className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant load times with offline support. Create episodes even without internet.
                  </p>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <Smartphone className="h-8 w-8 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Native Feel</h3>
                  <p className="text-sm text-muted-foreground">
                    Works like a real app on your home screen. No browser tabs needed.
                  </p>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <CheckCircle className="h-8 w-8 text-primary-glow mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Always Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic updates ensure you always have the latest features.
                  </p>
                </Card>
              </div>

              <Card className="p-8 bg-muted/50">
                <h2 className="text-2xl font-bold mb-6">Installation Instructions</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">1</span>
                      iPhone / iPad (Safari)
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-8">
                      <li>Tap the Share button (square with arrow)</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" in the top right</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm">2</span>
                      Android (Chrome)
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-8">
                      <li>Tap the menu button (three dots)</li>
                      <li>Tap "Install app" or "Add to Home screen"</li>
                      <li>Tap "Install"</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-glow text-primary-foreground text-sm">3</span>
                      Desktop (Chrome, Edge, Brave)
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-8">
                      <li>Look for the install icon in the address bar</li>
                      <li>Click "Install"</li>
                      <li>The app will open in its own window</li>
                    </ol>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Install;
