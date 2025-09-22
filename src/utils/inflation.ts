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

// Calculate personal inflation rate for each time period
export function calculatePersonalCPI(
  cpiData: CPIData[],
  percentageWeights: SpendingWeights
): InflationResult[] {
  const decimalWeights = percentageToDecimalWeights(percentageWeights);
  
  console.log('Calculating with weights:', percentageWeights); // Debug log
  console.log('CPI data:', cpiData[0]); // Debug log
  
  return cpiData.map(dataPoint => {
    // Calculate weighted personal inflation rate directly from the inflation data
    let personalYoY = 0;
    Object.entries(decimalWeights).forEach(([division, weight]) => {
      // Handle CSV format with "D" prefix (D01_Food vs 01_Food)
      const cleanDivision = division.replace(/^0/, 'D0'); // Convert "01_Food" to "D01_Food"
      const inflationRate = dataPoint.divisions[cleanDivision] || dataPoint.divisions[division] || 0;
      personalYoY += weight * inflationRate;
      console.log(`Division ${division} -> ${cleanDivision}: weight=${weight}, rate=${inflationRate}, contribution=${weight * inflationRate}`); // Debug log
    });

    // Swedish YoY is already provided in the CPI_All column as inflation rate
    const swedishYoY = dataPoint.CPI_All;
    const difference = personalYoY - swedishYoY;

    return {
      date: dataPoint.date,
      personalCPI: 100, // Not needed since we work with rates directly
      swedishCPI: 100, // Not needed since we work with rates directly
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

// Calculate division-specific inflation rates for AI insights
export function getDivisionYoYChanges(cpiData: CPIData[]): { [division: string]: number | null } {
  if (cpiData.length === 0) {
    return {};
  }

  // Get the latest data point - inflation rates are already calculated
  const latest = cpiData[cpiData.length - 1];
  const divisionChanges: { [division: string]: number | null } = {};
  
  Object.keys(latest.divisions).forEach(division => {
    divisionChanges[division] = latest.divisions[division];
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