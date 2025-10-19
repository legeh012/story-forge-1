import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BotCard } from "./BotCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Bot {
  id: string;
  name: string;
  bot_type: string;
  is_active: boolean;
  updated_at: string;
}

interface BotCategoryProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  bots: Bot[];
  runningBots: Set<string>;
  onToggle: (botId: string, currentStatus: boolean) => void;
  onRun: (bot: Bot) => void;
  getBotDescription: (type: string) => string;
}

export const BotCategory = ({
  title,
  description,
  icon,
  bots,
  runningBots,
  onToggle,
  onRun,
  getBotDescription,
}: BotCategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (bots.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{bots.length} bots</span>
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                name={bot.name}
                type={bot.bot_type.replace(/_/g, ' ')}
                description={getBotDescription(bot.bot_type)}
                isActive={bot.is_active}
                lastRun={bot.updated_at}
                onToggle={() => onToggle(bot.id, bot.is_active)}
                onRun={() => onRun(bot)}
                isRunning={runningBots.has(bot.id)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
