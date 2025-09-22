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

// COICOP division explanations
const DIVISION_EXPLANATIONS = {
  D01_Food: "Essential groceries including bread, meat, dairy, fruits, vegetables, and non-alcoholic beverages like water, coffee, and tea.",
  D02_AlcoholTobacco: "Alcoholic beverages (wine, beer, spirits) and tobacco products including cigarettes and smoking accessories.",
  D03_Clothing: "All clothing items for men, women, and children, plus footwear like shoes, boots, and accessories.",
  D04_Housing: "Rent, mortgage payments, utilities (electricity, gas, water), home maintenance, and household services.",
  D05_Furnishings: "Furniture, appliances, home textiles, kitchenware, tools, and routine household maintenance supplies.",
  D06_Health: "Medical services, prescription drugs, medical equipment, and health insurance not covered by public healthcare.",
  D07_Transport: "Vehicle purchases, fuel, public transport, vehicle maintenance, insurance, and other transport services.",
  D08_InfoComm: "Mobile and internet services, computers, phones, postal services, and communication equipment.",
  D09_Recreation: "Entertainment, sports, hobbies, books, newspapers, package holidays, and recreational equipment.",
  D10_Education: "School fees, university tuition, educational courses, books, and learning materials.",
  D11_Restaurants: "Dining out, takeaway food, hotels, cafes, bars, and accommodation services.",
  D12_InsuranceFinance: "Insurance premiums, banking fees, investment services, and other financial services.",
  D13_PersonalMisc: "Personal care items, jewelry, childcare, social services, and miscellaneous goods and services."
} as const;

interface SpendingInputsProps {
  weights: SpendingWeights;
  mode: InputMode;
  onWeightsChange: (weights: SpendingWeights) => void;
  onModeChange: (mode: InputMode) => void;
}

const SpendingInputs = ({ weights, mode, onWeightsChange, onModeChange }: SpendingInputsProps) => {
  const [inputValues, setInputValues] = useState<SpendingWeights>(weights);

  // Update input values when weights or mode changes
  useEffect(() => {
    if (mode === 'percentage') {
      // Show the actual percentage weights
      setInputValues(weights);
    } else {
      // Convert percentages to representative SEK amounts (assuming 10,000 SEK total monthly spending)
      const totalMonthlySpending = 10000;
      const sekValues: SpendingWeights = {};
      Object.entries(weights).forEach(([key, percentage]) => {
        sekValues[key] = (percentage / 100) * totalMonthlySpending;
      });
      setInputValues(sekValues);
    }
  }, [weights, mode]);

  const handleModeChange = (newMode: InputMode) => {
    onModeChange(newMode);
  };

  const handleInputChange = (divisionKey: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const newValues = { ...inputValues, [divisionKey]: numericValue };
    setInputValues(newValues);
    
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
    <Card className="p-6 bg-card border border-border shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Your Spending Mix</h3>
        
        <ToggleGroup type="single" value={mode} onValueChange={(value) => value && handleModeChange(value as InputMode)}>
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

      <TooltipProvider>
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
                      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{DIVISION_EXPLANATIONS[divisionKey as keyof typeof DIVISION_EXPLANATIONS]}</p>
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
              <div className="w-12 text-sm text-muted-foreground text-right">
                {mode === 'percentage' ? '%' : 'SEK'}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>

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
  );
};

export default SpendingInputs;