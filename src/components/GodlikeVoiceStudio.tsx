import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useGodlikeVoice, VoiceType } from '@/hooks/useGodlikeVoice';
import { Loader2, Volume2, Wand2 } from 'lucide-react';

const GodlikeVoiceStudio = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<VoiceType>('nova');
  const [speed, setSpeed] = useState([1.0]);
  const { generateVoice, isGenerating, audioUrl } = useGodlikeVoice();

  const handleGenerate = async () => {
    if (!text.trim()) return;
    await generateVoice({ text, voice, speed: speed[0] });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">⚡ GODLIKE Voice Studio</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Voice Text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to GODLIKE quality speech..."
            className="min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Voice Type</label>
            <Select value={voice} onValueChange={(v) => setVoice(v as VoiceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">Nova (Female)</SelectItem>
                <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                <SelectItem value="echo">Echo (Male)</SelectItem>
                <SelectItem value="fable">Fable (British Male)</SelectItem>
                <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Speed: {speed[0]}x</label>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.25}
              max={4.0}
              step={0.25}
              className="mt-2"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !text.trim()}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating GODLIKE Voice...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Generate HD Voice
            </>
          )}
        </Button>

        {audioUrl && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm font-medium mb-2">✅ GODLIKE Voice Ready</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default GodlikeVoiceStudio;
