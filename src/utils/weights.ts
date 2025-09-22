// Utility functions for handling spending weights and normalization

export interface SpendingWeights {
  [divisionKey: string]: number;
}

export type InputMode = 'percentage' | 'sek';

// Normalize percentage weights to sum to 100%
export function normalizePercentageWeights(weights: SpendingWeights): SpendingWeights {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (total === 0) {
    return weights;
  }
  
  const normalized: SpendingWeights = {};
  Object.entries(weights).forEach(([key, weight]) => {
    normalized[key] = (weight / total) * 100;
  });
  
  return normalized;
}

// Convert SEK amounts to percentage weights
export function sekToPercentageWeights(sekAmounts: SpendingWeights): SpendingWeights {
  const total = Object.values(sekAmounts).reduce((sum, amount) => sum + amount, 0);
  
  if (total === 0) {
    // Return equal weights if all amounts are zero
    const divisions = Object.keys(sekAmounts);
    const equalWeight = 100 / divisions.length;
    const equalWeights: SpendingWeights = {};
    divisions.forEach(key => {
      equalWeights[key] = equalWeight;
    });
    return equalWeights;
  }
  
  const percentages: SpendingWeights = {};
  Object.entries(sekAmounts).forEach(([key, amount]) => {
    percentages[key] = (amount / total) * 100;
  });
  
  return percentages;
}

// Convert percentage weights to decimal weights (0-1)
export function percentageToDecimalWeights(percentageWeights: SpendingWeights): SpendingWeights {
  const decimalWeights: SpendingWeights = {};
  Object.entries(percentageWeights).forEach(([key, percentage]) => {
    decimalWeights[key] = percentage / 100;
  });
  return decimalWeights;
}

// Validate that weights are reasonable
export function validateWeights(weights: SpendingWeights, mode: InputMode): string[] {
  const errors: string[] = [];
  
  Object.entries(weights).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key}: Value cannot be negative`);
    }
    
    if (mode === 'percentage' && value > 100) {
      errors.push(`${key}: Percentage cannot exceed 100%`);
    }
    
    if (mode === 'sek' && value > 1000000) {
      errors.push(`${key}: Amount seems unrealistically high`);
    }
  });
  
  return errors;
}

// Get total of all weights
export function getTotalWeight(weights: SpendingWeights): number {
  return Object.values(weights).reduce((sum, weight) => sum + weight, 0);
}