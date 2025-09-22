import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

import SpendingInputs from '@/components/SpendingInputs';
import InflationChart from '@/components/InflationChart';
import KPICard from '@/components/KPICard';
import AIInsightCard from '@/components/AIInsightCard';
import ShareLink from '@/components/ShareLink';

import { scbService, SWEDEN_AVERAGE_WEIGHTS } from '@/services/scb';
import { SpendingWeights, InputMode, normalizePercentageWeights } from '@/utils/weights';
import { calculatePersonalCPI, getLatestInflationMetrics, formatPercentage, formatPercentagePoints } from '@/utils/inflation';
import type { CPIData } from '@/services/scb';

const Simulator = () => {
  const [searchParams] = useSearchParams();
  const [weights, setWeights] = useState<SpendingWeights>(SWEDEN_AVERAGE_WEIGHTS);
  const [mode, setMode] = useState<InputMode>('percentage');
  const [cpiData, setCpiData] = useState<CPIData[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAIInsight, setShowAIInsight] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, isDemo: isDemoData } = await scbService.fetchCPIData();
        setCpiData(data);
        setIsDemo(isDemoData);
      } catch (error) {
        console.error('Failed to load CPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Parse URL parameters on mount
  useEffect(() => {
    const urlMode = searchParams.get('mode') as InputMode;
    if (urlMode && ['percentage', 'sek'].includes(urlMode)) {
      setMode(urlMode);
    }

    // Parse weights from URL
    const urlWeights: SpendingWeights = {};
    let hasUrlWeights = false;

    Object.keys(SWEDEN_AVERAGE_WEIGHTS).forEach(key => {
      const value = searchParams.get(key);
      if (value !== null) {
        urlWeights[key] = parseFloat(value) || 0;
        hasUrlWeights = true;
      }
    });

    if (hasUrlWeights) {
      setWeights(urlWeights);
    }
  }, [searchParams]);

  // Calculate inflation results
  const inflationResults = useMemo(() => {
    if (cpiData.length === 0) return [];
    
    // Normalize weights to ensure they sum to 100%
    const normalizedWeights = normalizePercentageWeights(weights);
    return calculatePersonalCPI(cpiData, normalizedWeights);
  }, [cpiData, weights]);

  // Get latest metrics for KPI cards
  const latestMetrics = useMemo(() => {
    return getLatestInflationMetrics(inflationResults);
  }, [inflationResults]);


  const handleWeightsChange = (newWeights: SpendingWeights) => {
    setWeights(newWeights);
  };

  const getTrendForValue = (value: number | null) => {
    if (value === null) return 'neutral';
    return value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CPI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My<span className="text-primary">flation</span> Calculator</h1>
              <p className="text-muted-foreground">Compare your personal inflation to Sweden's CPI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ShareLink weights={weights} mode={mode} />
            <Link 
              to="/about" 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              About
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-4">
            <SpendingInputs
              weights={weights}
              mode={mode}
              onWeightsChange={handleWeightsChange}
              onModeChange={setMode}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-8 space-y-6">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <KPICard
                title="Your 12-Month Inflation"
                value={formatPercentage(latestMetrics.personalYoY)}
                trend={getTrendForValue(latestMetrics.personalYoY)}
                subtitle="Based on your spending mix"
              />
              <KPICard
                title="Sweden 12-Month Inflation"
                value={formatPercentage(latestMetrics.swedishYoY)}
                trend={getTrendForValue(latestMetrics.swedishYoY)}
                subtitle="Official CPI headline rate"
              />
              <KPICard
                title="Difference"
                value={formatPercentagePoints(latestMetrics.difference)}
                trend={getTrendForValue(latestMetrics.difference)}
                subtitle="Percentage points vs Sweden"
              />
            </div>

            {/* Chart */}
            <InflationChart data={inflationResults} isDemo={isDemo} />

            {/* AI Insight */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowAIInsight(true)}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Explain with AI
              </Button>
            </div>

            {showAIInsight && (
              <AIInsightCard
                weights={weights}
                cpiData={cpiData}
                latestMetrics={latestMetrics}
                onClose={() => setShowAIInsight(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;