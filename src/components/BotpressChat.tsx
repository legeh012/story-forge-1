import { useEffect } from 'react';

interface BotpressChatProps {
  botId: string;
}

const BotpressChat = ({ botId }: BotpressChatProps) => {
  useEffect(() => {
    // Load Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v1/inject.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize Botpress webchat
      (window as any).botpressWebChat.init({
        botId: botId,
        hostUrl: 'https://cdn.botpress.cloud/webchat/v1',
        messagingUrl: 'https://messaging.botpress.cloud',
        clientId: botId,
        webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/botpress-webhook`,
        botName: 'SayWalahi AI Assistant',
        botConversationDescription: 'Create episodes, download content, and more!',
        stylesheet: 'https://webchat-styler-css.botpress.app/prod/code/f0338fff-3771-43cb-91fc-85f5684f83f6/v61455/style.css',
        enableConversationDeletion: true,
        showPoweredBy: false,
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [botId]);

  return null;
};

export default BotpressChat;
