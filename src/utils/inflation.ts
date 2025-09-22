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
  
  console.log('User weights (will be applied to ALL months):', percentageWeights);
  console.log('Decimal weights:', decimalWeights);
  
  return cpiData.map((dataPoint, index) => {
    // Calculate weighted personal inflation rate using USER'S WEIGHTS (same for all months)
    let personalYoY = 0;
    
    // Map division keys to CSV headers
    const divisionMapping: { [key: string]: string } = {
      '01_Food': 'D01_Food',
      '02_AlcoholTobacco': 'D02_AlcoholTobacco', 
      '03_Clothing': 'D03_Clothing',
      '04_Housing': 'D04_Housing',
      '05_Furnishings': 'D05_Furnishings',
      '06_Health': 'D06_Health',
      '07_Transport': 'D07_Transport',
      '08_Communication': 'D08_InfoComm',
      '09_Recreation': 'D09_Recreation',
      '10_Education': 'D10_Education',
      '11_RestaurantsHotels': 'D11_Restaurants',
      '12_Misc': 'D12_InsuranceFinance'
    };
    
    Object.entries(decimalWeights).forEach(([division, weight]) => {
      const csvHeader = divisionMapping[division];
      const inflationRate = dataPoint.divisions[csvHeader] || 0;
      personalYoY += weight * inflationRate;
      
      if (index === 0) {
        console.log(`${division} -> ${csvHeader}: weight=${weight.toFixed(4)}, rate=${inflationRate}%, contribution=${(weight * inflationRate).toFixed(4)}%`);
      }
    });

    if (index === 0) {
      console.log(`${dataPoint.date}: Personal=${personalYoY.toFixed(2)}%, Swedish=${dataPoint.CPI_All}%`);
    }

    // Swedish YoY is the official CPI for that month
    const swedishYoY = dataPoint.CPI_All;
    const difference = personalYoY - swedishYoY;

    return {
      date: dataPoint.date,
      personalCPI: 100,
      swedishCPI: 100,
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