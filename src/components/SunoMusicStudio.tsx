import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Music, Sparkles, Copy, ExternalLink, Loader2, Play } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  personality: string;
  role: string;
}

interface SunoMusicStudioProps {
  projectId?: string;
  episodeId?: string;
}

export const SunoMusicStudio = ({ projectId, episodeId }: SunoMusicStudioProps) => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [musicStyle, setMusicStyle] = useState('Urban/Hip-Hop');
  const [mood, setMood] = useState('Confident');
  const [duration, setDuration] = useState('30');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [musicSpec, setMusicSpec] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      fetchCharacters();
    }
  }, [projectId]);

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      setCharacters(data || []);
      
      // Auto-select Lucky/Luckiee if exists
      const luckyChar = data?.find(c => 
        c.name.toLowerCase().includes('lucky') || 
        c.name.toLowerCase().includes('luckiee')
      );
      if (luckyChar) {
        setSelectedCharacter(luckyChar.id);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const generateMusic = async () => {
    if (!selectedCharacter) {
      toast({
        title: "Select Character",
        description: "Please select a character first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPrompt('');
    setMusicSpec(null);

    try {
      const character = characters.find(c => c.id === selectedCharacter);
      if (!character) throw new Error('Character not found');

      const { data, error } = await supabase.functions.invoke('suno-music-generator', {
        body: {
          characterName: character.name,
          characterPersonality: character.personality,
          musicStyle,
          mood,
          duration: parseInt(duration),
          customPrompt: customPrompt || undefined,
          episodeId,
        },
      });

      if (error) throw error;

      setGeneratedPrompt(data.sunoPrompt);
      setMusicSpec(data.musicSpec);

      toast({
        title: "🎵 Music Prompt Generated!",
        description: `Ready for Suno AI - ${character.name}'s theme`,
      });

    } catch (error) {
      console.error('Music generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate music',
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast({
      title: "Copied!",
      description: "Suno prompt copied to clipboard",
    });
  };

  const openSuno = () => {
    window.open('https://suno.com/create', '_blank');
  };

  const selectedCharData = characters.find(c => c.id === selectedCharacter);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <CardTitle>Suno Music Studio</CardTitle>
        </div>
        <CardDescription>
          Generate character theme music with Suno AI - Perfect for Lucky/Luckiee @djluckluck
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Character Selection */}
        <div className="space-y-2">
          <Label>Character</Label>
          <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              {characters.map((char) => (
                <SelectItem key={char.id} value={char.id}>
                  {char.name} - {char.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCharData && (
            <p className="text-sm text-muted-foreground">
              {selectedCharData.personality}
            </p>
          )}
        </div>

        {/* Music Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Music Style</Label>
            <Select value={musicStyle} onValueChange={setMusicStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urban/Hip-Hop">Urban/Hip-Hop</SelectItem>
                <SelectItem value="Afrobeats">Afrobeats</SelectItem>
                <SelectItem value="Trap">Trap</SelectItem>
                <SelectItem value="R&B">R&B</SelectItem>
                <SelectItem value="Amapiano">Amapiano</SelectItem>
                <SelectItem value="Drill">Drill</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mood</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Confident">Confident</SelectItem>
                <SelectItem value="Energetic">Energetic</SelectItem>
                <SelectItem value="Dramatic">Dramatic</SelectItem>
                <SelectItem value="Chill">Chill</SelectItem>
                <SelectItem value="Intense">Intense</SelectItem>
                <SelectItem value="Romantic">Romantic</SelectItem>
                <SelectItem value="Aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Duration (seconds)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="15"
              max="180"
            />
          </div>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label>Custom Suno Prompt (Optional)</Label>
          <Textarea
            placeholder="e.g., 'Upbeat Afrobeats with talking drum and synth leads, confident male vocals'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateMusic}
          disabled={isGenerating || !selectedCharacter}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Music Prompt...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Suno Music
            </>
          )}
        </Button>

        {/* Generated Results */}
        {generatedPrompt && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Music className="h-4 w-4" />
                Suno Prompt Ready
              </h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyPrompt}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button size="sm" onClick={openSuno}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open Suno
                </Button>
              </div>
            </div>

            <div className="p-3 bg-background rounded border">
              <p className="text-sm">{generatedPrompt}</p>
            </div>

            {musicSpec && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Style: {musicSpec.style}</Badge>
                  <Badge variant="secondary">Mood: {musicSpec.mood}</Badge>
                  <Badge variant="secondary">BPM: {musicSpec.bpm}</Badge>
                  <Badge variant="secondary">Key: {musicSpec.key}</Badge>
                  <Badge variant="secondary">Duration: {musicSpec.duration}s</Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Instruments:</p>
                  <div className="flex flex-wrap gap-1">
                    {musicSpec.instruments.map((inst: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {inst}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Structure:</p>
                  <div className="space-y-1">
                    {musicSpec.structure.map((part: string, i: number) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        {part}
                      </div>
                    ))}
                  </div>
                </div>

                {musicSpec.vocalStyle !== 'none' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Vocal Style:</p>
                    <p className="text-xs text-muted-foreground">{musicSpec.vocalStyle}</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t text-xs text-muted-foreground">
              💡 Tip: Copy this prompt and paste it into Suno AI to generate your character's theme music
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
