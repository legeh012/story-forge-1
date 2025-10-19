import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, Pause } from "lucide-react";

interface BotCardProps {
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  lastRun?: string;
  onToggle: () => void;
  onRun: () => void;
  isRunning?: boolean;
}

export const BotCard = ({ 
  name, 
  type, 
  description, 
  isActive, 
  lastRun, 
  onToggle, 
  onRun,
  isRunning 
}: BotCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription className="text-xs mt-1">{type}</CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        {lastRun && (
          <p className="text-xs text-muted-foreground">
            Last run: {new Date(lastRun).toLocaleString()}
          </p>
        )}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={onRun} 
            disabled={isRunning}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Run Now"}
          </Button>
          <Button 
            size="sm" 
            variant={isActive ? "destructive" : "outline"}
            onClick={onToggle}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
