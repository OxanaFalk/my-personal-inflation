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
  private readonly totalCPIUrl = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPItotM';
  private readonly coicopUrl = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPICOI80MN';
  
  async fetchCPIData(): Promise<{ data: CPIData[], isDemo: boolean }> {
    try {
      // Try to fetch from SCB API first
      const response = await this.fetchFromSCB();
      if (response) {
        return { data: response, isDemo: false };
      }
    } catch (error) {
      console.warn('Failed to fetch from SCB API, using fallback data:', error);
    }
    
    // Fallback to embedded CSV data
    return { data: await this.loadFallbackData(), isDemo: true };
  }

  private async fetchFromSCB(): Promise<CPIData[] | null> {
    try {
      // Use different CORS proxy
      const proxyUrl = 'https://api.cors.lol/?url=';
      
      // Fetch total CPI data (latest month only)
      const totalQuery = {
        "query": [
          {
            "code": "ContentsCode",
            "selection": {
              "filter": "item",
              "values": ["PR0101N1"] // Index values
            }
          }
        ],
        "response": {
          "format": "json-stat2"
        }
      };

      // Try to fetch just the total CPI data first
      const totalUrl = `${proxyUrl}${encodeURIComponent(this.totalCPIUrl)}`;

      const totalResponse = await fetch(totalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(totalQuery)
      });

      if (!totalResponse.ok) {
        throw new Error(`SCB API error: ${totalResponse.status}`);
      }

      const totalData = await totalResponse.json();
      
      // For now, just log the response to see what we get
      console.log('SCB API Response:', totalData);
      
      // Return empty to trigger fallback until we can properly parse the response
      return [];
      
    } catch (error) {
      console.error('SCB API fetch failed:', error);
      return null;
    }
  }

  private parseSCBResponse(totalData: any, coicopData: any): CPIData[] {
    try {
      // For this implementation, we'll focus on getting the latest values
      // SCB returns JSON-stat2 format with dimensions and values
      
      // Extract latest CPI total value
      let latestCPITotal = 120.0; // fallback value
      if (totalData.value && Array.isArray(totalData.value) && totalData.value.length > 0) {
        // Get the last non-null value
        const nonNullValues = totalData.value.filter((v: any) => v !== null);
        if (nonNullValues.length > 0) {
          latestCPITotal = nonNullValues[nonNullValues.length - 1];
        }
      }

      // Extract COICOP division values
      const divisions: { [key: string]: number } = {};
      
      if (coicopData.value && Array.isArray(coicopData.value)) {
        // Parse dimensions to understand data structure
        const dimensionIds = coicopData.id || [];
        const sizes = coicopData.size || [];
        
        // Find VaruTjanstegrupp (goods/services group) dimension
        const groupDimIndex = dimensionIds.indexOf('VaruTjanstegrupp');
        const timeDimIndex = dimensionIds.indexOf('Tid');
        
        if (groupDimIndex !== -1 && coicopData.dimension?.VaruTjanstegrupp?.category?.index) {
          const groupCategories = coicopData.dimension.VaruTjanstegrupp.category.index;
          const groupCount = sizes[groupDimIndex] || 12;
          
          // Map group codes to division keys
          const groupMapping: { [key: string]: string } = {
            '01': 'D01_Food',
            '02': 'D02_AlcoholTobacco', 
            '03': 'D03_Clothing',
            '04': 'D04_Housing',
            '05': 'D05_Furnishings',
            '06': 'D06_Health',
            '07': 'D07_Transport',
            '08': 'D08_InfoComm',
            '09': 'D09_Recreation',
            '10': 'D10_Education',
            '11': 'D11_Restaurants',
            '12': 'D12_InsuranceFinance'
          };
          
          // Extract values for each group (taking latest time period)
          if (Array.isArray(groupCategories)) {
            groupCategories.forEach((groupCode: string, index: number) => {
              const divisionKey = groupMapping[groupCode];
              if (divisionKey && coicopData.value[index] !== null) {
                divisions[divisionKey] = coicopData.value[index];
              }
            });
          } else if (typeof groupCategories === 'object') {
            Object.keys(groupCategories).forEach((groupCode: string) => {
              const divisionKey = groupMapping[groupCode];
              const index = groupCategories[groupCode];
              if (divisionKey && index < coicopData.value.length && coicopData.value[index] !== null) {
                divisions[divisionKey] = coicopData.value[index];
              }
            });
          }
        }
      }
      
      // If we couldn't parse division data, return empty to trigger fallback
      if (Object.keys(divisions).length < 10) {
        console.warn('Could not parse enough division data from SCB response');
        return [];
      }
      
      // Create a single CPIData entry with current date
      const currentDate = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      return [{
        date: currentDate,
        CPI_All: latestCPITotal,
        divisions
      }];
      
    } catch (error) {
      console.error('Error parsing SCB response:', error);
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