import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, Percent, DollarSign, HelpCircle } from "lucide-react";
import { DIVISIONS, SWEDEN_AVERAGE_WEIGHTS } from '@/services/scb';
import { SpendingWeights, InputMode, normalizePercentageWeights, sekToPercentageWeights, getTotalWeight } from '@/utils/weights';

interface SpendingInputsProps {
  weights: SpendingWeights;
  mode: InputMode;
  onWeightsChange: (weights: SpendingWeights) => void;
  onModeChange: (mode: InputMode) => void;
}

const SpendingInputs = ({ weights, mode, onWeightsChange, onModeChange }: SpendingInputsProps) => {
  const [inputValues, setInputValues] = useState<SpendingWeights>(weights);

  // Sync inputValues with weights prop changes
  useEffect(() => {
    setInputValues(weights);
  }, [weights]);

  const handleInputChange = (divisionKey: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newValues = { ...inputValues, [divisionKey]: numericValue };
    setInputValues(newValues);
    
    console.log('Input changed:', divisionKey, numericValue, newValues); // Debug log
    
    // Convert to percentages and update parent
    if (mode === 'percentage') {
      onWeightsChange(newValues);
    } else {
      const percentageWeights = sekToPercentageWeights(newValues);
      onWeightsChange(percentageWeights);
    }
  };

  const handleResetToSweden = () => {
    const swedenWeights = { ...SWEDEN_AVERAGE_WEIGHTS };
    setInputValues(swedenWeights);
    onWeightsChange(swedenWeights);
  };

  const handleResetAll = () => {
    const emptyWeights: SpendingWeights = {};
    Object.keys(DIVISIONS).forEach(key => {
      emptyWeights[key] = 0;
    });
    setInputValues(emptyWeights);
    onWeightsChange(emptyWeights);
  };

  const totalWeight = getTotalWeight(inputValues);

  return (
    <TooltipProvider>
      <Card className="p-6 bg-card border border-border shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Your Spending Mix</h3>
          
          <ToggleGroup type="single" value={mode} onValueChange={(value) => value && onModeChange(value as InputMode)}>
            <ToggleGroupItem value="percentage" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <Percent className="h-4 w-4 mr-1" />
              %
            </ToggleGroupItem>
            <ToggleGroupItem value="sek" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              SEK
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid gap-4 mb-6">
          {Object.entries(DIVISIONS).map(([divisionKey, division]) => (
            <div key={divisionKey} className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor={divisionKey} className="text-sm font-medium">
                    {division.code}. {division.name}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-64">
                      <p className="text-xs">{division.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="w-24">
                <Input
                  id={divisionKey}
                  type="number"
                  min="0"
                  step={mode === 'percentage' ? '0.1' : '1'}
                  max={mode === 'percentage' ? '100' : undefined}
                  value={inputValues[divisionKey] || ''}
                  onChange={(e) => handleInputChange(divisionKey, e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
              </div>
              <div className="w-16 text-sm text-muted-foreground text-right">
                {mode === 'percentage' ? (
                  <span className="flex items-center justify-end gap-1">
                    % <span className="text-xs opacity-60">({SWEDEN_AVERAGE_WEIGHTS[divisionKey as keyof typeof SWEDEN_AVERAGE_WEIGHTS]?.toFixed(1)})</span>
                  </span>
                ) : 'SEK'}
              </div>
            </div>
          ))}
        </div>

      <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
        <span className="font-medium">Total:</span>
        <span className="font-bold">
          {totalWeight.toFixed(1)} {mode === 'percentage' ? '%' : 'SEK'}
        </span>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleResetToSweden}
          className="flex-1"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Sweden Average
        </Button>
        <Button 
          variant="outline" 
          onClick={handleResetAll}
          className="flex-1"
        >
          Reset All
        </Button>
      </div>

      {mode === 'percentage' && totalWeight !== 100 && totalWeight > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Total is {totalWeight.toFixed(1)}%. Values will be normalized to 100%.
          </p>
        </div>
      )}
      </Card>
    </TooltipProvider>
  );
};

export default SpendingInputs;