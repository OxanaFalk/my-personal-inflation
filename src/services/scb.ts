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
      // Fetch total CPI data
      const totalQuery = {
        "query": [
          {
            "code": "ContentsCode",
            "selection": {
              "filter": "item",
              "values": ["000002ZI"] // Yearly change
            }
          }
        ],
        "response": {
          "format": "json-stat2"
        }
      };

      // Fetch COICOP division data
      const coicopQuery = {
        "query": [
          {
            "code": "ContentsCode",
            "selection": {
              "filter": "item",
              "values": ["000002ZI"] // Yearly change
            }
          },
          {
            "code": "VaruTjanstegrupp",
            "selection": {
              "filter": "item",
              "values": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
            }
          }
        ],
        "response": {
          "format": "json-stat2"
        }
      };

      const [totalResponse, coicopResponse] = await Promise.all([
        fetch(this.totalCPIUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(totalQuery)
        }),
        fetch(this.coicopUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coicopQuery)
        })
      ]);

      if (!totalResponse.ok || !coicopResponse.ok) {
        throw new Error(`SCB API error: ${totalResponse.status} / ${coicopResponse.status}`);
      }

      const [totalData, coicopData] = await Promise.all([
        totalResponse.json(),
        coicopResponse.json()
      ]);

      return this.parseSCBResponse(totalData, coicopData);
    } catch (error) {
      console.error('SCB API fetch failed:', error);
      return null;
    }
  }

  private parseSCBResponse(totalData: any, coicopData: any): CPIData[] {
    // Parse JSON-stat2 format from SCB
    // This would need to be implemented based on actual SCB response structure
    // For now, return empty array to trigger fallback
    return [];
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
      const values = line.split(',').map(v => parseFloat(v.trim()));
      const divisions: { [key: string]: number } = {};
      
      // Skip first two columns (date, CPI_All)
      headers.slice(2).forEach((header, index) => {
        divisions[header.trim()] = values[index + 2];
      });
      
      return {
        date: values[0].toString(), // Will be processed as date string
        CPI_All: values[1],
        divisions
      };
    });
  }
}

export const scbService = new SCBService();