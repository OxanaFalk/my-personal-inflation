// SCB PXWeb API service for fetching Swedish CPI data
export interface CPIData {
  date: string;
  CPI_All: number;
  divisions: {
    [key: string]: number;
  };
}

// COICOP division mapping (12 divisions)
export const DIVISIONS = {
  'D01_Food': { code: '01', name: 'Food and non-alcoholic beverages' },
  'D02_AlcoholTobacco': { code: '02', name: 'Alcoholic beverages, tobacco and narcotics' },
  'D03_Clothing': { code: '03', name: 'Clothing and footwear' },
  'D04_Housing': { code: '04', name: 'Housing, water, electricity, gas and other fuels' },
  'D05_Furnishings': { code: '05', name: 'Furnishings, household equipment and routine household maintenance' },
  'D06_Health': { code: '06', name: 'Health' },
  'D07_Transport': { code: '07', name: 'Transport' },
  'D08_InfoComm': { code: '08', name: 'Information and communication' },
  'D09_Recreation': { code: '09', name: 'Recreation, sport and culture' },
  'D10_Education': { code: '10', name: 'Education services' },
  'D11_Restaurants': { code: '11', name: 'Restaurants and accommodation services' },
  'D12_InsuranceFinance': { code: '12', name: 'Insurance and financial services' },
} as const;

// Swedish average spending weights (approximation for preset) - 12 divisions
export const SWEDEN_AVERAGE_WEIGHTS = {
  D01_Food: 13.3,
  D02_AlcoholTobacco: 2.2,
  D03_Clothing: 4.4,  
  D04_Housing: 29.7,
  D05_Furnishings: 5.0,
  D06_Health: 4.1,
  D07_Transport: 13.7,
  D08_InfoComm: 2.9,
  D09_Recreation: 11.1,
  D10_Education: 0.6,
  D11_Restaurants: 6.0,
  D12_InsuranceFinance: 7.0,
};

class SCBService {
  private readonly totalCPIUrl = 'https://api.scb.se/ov0104/v2beta/api/v2/tables/TAB5737/data';
  private readonly coicopUrl = 'https://api.scb.se/ov0104/v2beta/api/v2/tables/TAB5512/data';
  
  async fetchCPIData(): Promise<{ data: CPIData[], isDemo: boolean }> {
    try {
      // Try to fetch from SCB API first
      const response = await this.fetchFromSCB();
      if (response) {
        console.log('Successfully loaded SCB API data:', response.length, 'records');
        return { data: response, isDemo: false };
      }
    } catch (error) {
      console.warn('Failed to fetch from SCB API, using fallback data:', error);
    }
    
    console.log('Using fallback CSV data...');
    // Fallback to embedded CSV data
    const fallbackData = await this.loadFallbackData();
    console.log('Loaded fallback data:', fallbackData.length, 'records');
    return { data: fallbackData, isDemo: true };
  }

  private async fetchFromSCB(): Promise<CPIData[] | null> {
    try {
      console.log('Fetching 12 months of SCB data...');
      
      // Get 12 months of recent data - SCB publishes with ~1-2 month delay
      // Start from 2 months ago and go back 12 months
      const currentDate = new Date();
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1); // 2 months ago
      const months: Date[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        months.push(monthDate);
      }
      
      // Try direct API calls first (without CORS proxy)
      const results: CPIData[] = [];
      
      for (const monthDate of months) {
        const monthString = `${monthDate.getFullYear()}M${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        
        try {
          console.log(`Attempting to fetch data for ${monthString}`);
          
          // Build URLs - use YoY percentage changes as shown in user's example
          const totalParams = new URLSearchParams({
            'lang': 'sv',
            'valueCodes[ContentsCode]': '000004VV', // 12-month changes (YoY percentages)
            'valueCodes[Tid]': monthString
          });
          
          const coicopParams = new URLSearchParams({
            'lang': 'sv',
            'valueCodes[ContentsCode]': '000004VV', // 12-month changes (YoY percentages)
            'valueCodes[VaruTjanstegrupp]': '01,02,03,04,05,06,07,08,09,10,11,12',
            'valueCodes[Tid]': monthString,
            'codelist[VaruTjanstegrupp]': 'vs_VaruTjänstegrCoicopA'
          });
          
          const totalUrl = `${this.totalCPIUrl}?${totalParams.toString()}`;
          const coicopUrl = `${this.coicopUrl}?${coicopParams.toString()}`;
          
          // Try both direct and CORS proxy
          const attempts = [
            // Direct calls
            { totalUrl, coicopUrl },
            // CORS proxy calls
            { 
              totalUrl: `https://api.cors.lol/?url=${encodeURIComponent(totalUrl)}`,
              coicopUrl: `https://api.cors.lol/?url=${encodeURIComponent(coicopUrl)}`
            }
          ];
          
          let success = false;
          for (const { totalUrl: tUrl, coicopUrl: cUrl } of attempts) {
            try {
              const [totalResponse, coicopResponse] = await Promise.all([
                fetch(tUrl),
                fetch(cUrl)
              ]);
              
              if (totalResponse.ok && coicopResponse.ok) {
                const [totalData, coicopData] = await Promise.all([
                  totalResponse.text(),
                  coicopResponse.text()
                ]);
                
                const monthData = this.parsePXStatResponse(totalData, coicopData, monthDate);
                if (monthData && monthData.length > 0) {
                  results.push(...monthData);
                  success = true;
                  console.log(`Successfully fetched data for ${monthString}`);
                  break;
                }
              }
            } catch (e) {
              continue; // Try next approach
            }
          }
          
          if (!success) {
            console.warn(`Failed to fetch data for ${monthString}, continuing with other months`);
          }
          
        } catch (error) {
          console.warn(`Error fetching data for ${monthString}:`, error);
        }
      }
      
      return results.length > 0 ? results : null;
      
    } catch (error) {
      console.error('SCB API fetch failed:', error);
      return null;
    }
  }

  private parsePXStatResponse(totalData: string, coicopData: string, date: Date): CPIData[] {
    try {
      // Parse total CPI YoY percentage from PX-stat format
      let totalYoY = 1.1; // fallback value
      const totalDataMatch = totalData.match(/DATA=\s*([\d.-]+)/);
      if (totalDataMatch) {
        totalYoY = parseFloat(totalDataMatch[1]);
      }
      
      // Parse COICOP divisions from PX-stat format
      const divisions: { [key: string]: number } = {};
      
      // Extract data section from COICOP response
      const dataSection = coicopData.split('DATA=')[1];
      if (dataSection) {
        // Extract numbers (handle negative numbers and decimals)
        const numbers = dataSection.match(/([-]?\d+\.\d+)/g);
        
        if (numbers && numbers.length >= 12) {
          // Map to division keys in order (01, 02, 03, ..., 12)
          const groupMapping = [
            'D01_Food',
            'D02_AlcoholTobacco', 
            'D03_Clothing',
            'D04_Housing',
            'D05_Furnishings',
            'D06_Health',
            'D07_Transport',
            'D08_InfoComm',
            'D09_Recreation',
            'D10_Education',
            'D11_Restaurants',
            'D12_InsuranceFinance'
          ];
          
          groupMapping.forEach((divisionKey, index) => {
            if (index < numbers.length) {
              divisions[divisionKey] = parseFloat(numbers[index]);
            }
          });
        }
      }
      
      // Check if we have enough data
      if (Object.keys(divisions).length < 10) {
        console.warn('Not enough division data parsed from SCB PX-stat response');
        return [];
      }
      
      // Create CPIData entry with YoY data
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      console.log('Parsed SCB YoY data:', { totalYoY, divisions, date: dateString });
      
      return [{
        date: dateString,
        CPI_All: totalYoY, // This is now YoY percentage, not index
        divisions // These are also YoY percentages
      }];
      
    } catch (error) {
      console.error('Error parsing SCB PX-stat response:', error);
      return [];
    }
  }

  private async loadFallbackData(): Promise<CPIData[]> {
    try {
      const response = await fetch('/data/myflation_fallback.csv');
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Failed to load fallback data:', error);
      throw new Error('Could not load CPI data');
    }
  }

  private parseCSV(csvText: string): CPIData[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const divisions: { [key: string]: number } = {};
      
      // Skip first two columns (date, CPI_All) - date is string, CPI_All is number
      headers.slice(2).forEach((header, index) => {
        divisions[header.trim()] = parseFloat(values[index + 2]);
      });
      
      return {
        date: values[0].trim(), // Keep date as string
        CPI_All: parseFloat(values[1]),
        divisions
      };
    });
  }
}

export const scbService = new SCBService();