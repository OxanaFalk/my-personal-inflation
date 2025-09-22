import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Sparkles, Loader2 } from "lucide-react";
import { SpendingWeights } from '@/utils/weights';
import { getDivisionYoYChanges } from '@/utils/inflation';
import { DIVISIONS } from '@/services/scb';
import type { CPIData } from '@/services/scb';

interface AIInsightCardProps {
  weights: SpendingWeights;
  cpiData: CPIData[];
  latestMetrics: {
    personalYoY: number | null;
    swedishYoY: number | null;
    difference: number | null;
  };
  onClose: () => void;
}

const AIInsightCard = ({ weights, cpiData, latestMetrics, onClose }: AIInsightCardProps) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    
    try {
      // Get division-specific YoY changes
      const divisionChanges = getDivisionYoYChanges(cpiData);
      
      // Prepare context for AI
      const topDivisions = Object.entries(weights)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([div, weight]) => ({
          name: DIVISIONS[div as keyof typeof DIVISIONS]?.name || div,
          weight: weight.toFixed(1),
          change: divisionChanges[div]?.toFixed(1) || 'N/A'
        }));

      const prompt = `You are a data analyst. In 120-180 words, explain why the user's personal inflation (${latestMetrics.personalYoY?.toFixed(1)}%) differs from Sweden's headline inflation (${latestMetrics.swedishYoY?.toFixed(1)}%). 

User's top spending categories:
${topDivisions.map(d => `• ${d.name}: ${d.weight}% (${d.change}% YoY change)`).join('\n')}

The difference is ${latestMetrics.difference?.toFixed(1)} percentage points. Highlight 2-3 divisions that drive this difference, mention one period with visible movement, and end with one practical tip for reducing exposure. Keep a neutral tone and note this is illustrative based on SCB CPI (COICOP, 2020=100).`;

      // Simple mock AI response for demo - replace with actual AI service
      const mockInsight = generateMockInsight(latestMetrics, topDivisions);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsight(mockInsight);
    } catch (error) {
      console.error('Failed to generate AI insight:', error);
      setInsight('Sorry, unable to generate insights at the moment. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockInsight = (metrics: any, divisions: any[]) => {
    const diff = metrics.difference || 0;
    const direction = diff > 0 ? 'higher' : 'lower';
    const topCategory = divisions[0];
    
    return `Your personal inflation of ${metrics.personalYoY?.toFixed(1)}% is ${Math.abs(diff).toFixed(1)} percentage points ${direction} than Sweden's headline rate of ${metrics.swedishYoY?.toFixed(1)}%.

This difference is primarily driven by your spending allocation to ${topCategory.name} (${topCategory.weight}% vs Sweden's average), which experienced ${topCategory.change}% inflation. ${diff > 0 ? 'Your higher exposure to categories with above-average price increases' : 'Your lower exposure to high-inflation categories'} explains this deviation.

Looking at recent data, ${diff > 0 ? 'housing and energy costs have been significant contributors to the gap' : 'your spending pattern has provided some protection against broad price pressures'}.

Practical tip: Consider ${diff > 0 ? 'diversifying spending away from high-inflation categories where possible, particularly in discretionary areas' : 'maintaining your current spending allocation as it appears resilient to current inflationary pressures'}.

Note: This analysis is illustrative and based on SCB CPI data (COICOP, 2020=100).`;
  };

  return (
    <Card className="p-6 bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Inflation Insight</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!insight && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Get AI-powered analysis of your personal inflation drivers
          </p>
          <Button onClick={generateInsight} className="bg-gradient-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Insight
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your inflation pattern...</p>
        </div>
      )}

      {insight && (
        <div className="prose prose-sm max-w-none">
          <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 p-4 rounded-lg border-l-4 border-primary">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {insight}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIInsightCard;