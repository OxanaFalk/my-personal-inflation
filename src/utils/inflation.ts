// Inflation calculation utilities

import { CPIData } from '../services/scb';
import { SpendingWeights, percentageToDecimalWeights } from './weights';

export interface InflationResult {
  date: string;
  personalCPI: number;
  swedishCPI: number;
  personalYoY: number | null;
  swedishYoY: number | null;
  difference: number | null;
}

// Calculate personal CPI for each time period
export function calculatePersonalCPI(
  cpiData: CPIData[],
  percentageWeights: SpendingWeights
): InflationResult[] {
  const decimalWeights = percentageToDecimalWeights(percentageWeights);
  
  return cpiData.map((dataPoint, index) => {
    // Calculate weighted personal CPI
    let personalCPI = 0;
    Object.entries(decimalWeights).forEach(([division, weight]) => {
      const cpiValue = dataPoint.divisions[division] || 100; // Default to 100 if missing
      personalCPI += weight * cpiValue;
    });

    // Calculate YoY changes (if we have data from 12 months ago)
    let personalYoY: number | null = null;
    let swedishYoY: number | null = null;
    let difference: number | null = null;

    if (index >= 12) {
      const previousDataPoint = cpiData[index - 12];
      
      // Calculate previous period personal CPI
      let previousPersonalCPI = 0;
      Object.entries(decimalWeights).forEach(([division, weight]) => {
        const cpiValue = previousDataPoint.divisions[division] || 100;
        previousPersonalCPI += weight * cpiValue;
      });

      // Calculate year-over-year changes
      personalYoY = ((personalCPI / previousPersonalCPI) - 1) * 100;
      swedishYoY = ((dataPoint.CPI_All / previousDataPoint.CPI_All) - 1) * 100;
      difference = personalYoY - swedishYoY;
    }

    return {
      date: dataPoint.date,
      personalCPI,
      swedishCPI: dataPoint.CPI_All,
      personalYoY,
      swedishYoY,
      difference
    };
  });
}

// Get the latest inflation metrics
export function getLatestInflationMetrics(results: InflationResult[]): {
  personalYoY: number | null;
  swedishYoY: number | null;
  difference: number | null;
  date: string | null;
} {
  if (results.length === 0) {
    return {
      personalYoY: null,
      swedishYoY: null,
      difference: null,
      date: null
    };
  }

  const latest = results[results.length - 1];
  return {
    personalYoY: latest.personalYoY,
    swedishYoY: latest.swedishYoY,
    difference: latest.difference,
    date: latest.date
  };
}

// Calculate division-specific YoY changes for AI insights
export function getDivisionYoYChanges(cpiData: CPIData[]): { [division: string]: number | null } {
  if (cpiData.length < 13) {
    return {};
  }

  const latest = cpiData[cpiData.length - 1];
  const yearAgo = cpiData[cpiData.length - 13];

  const divisionChanges: { [division: string]: number | null } = {};
  
  Object.keys(latest.divisions).forEach(division => {
    const latestValue = latest.divisions[division];
    const yearAgoValue = yearAgo.divisions[division];
    
    if (latestValue && yearAgoValue) {
      divisionChanges[division] = ((latestValue / yearAgoValue) - 1) * 100;
    } else {
      divisionChanges[division] = null;
    }
  });

  return divisionChanges;
}

// Format percentage for display
export function formatPercentage(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Format percentage points for display
export function formatPercentagePoints(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}pp`;
}