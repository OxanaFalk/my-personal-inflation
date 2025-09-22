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
  private readonly baseUrl = 'https://api.scb.se/ov0104/v2beta/api/v2/tables/TAB5512/data';
  
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
      // Use CORS proxy to access SCB API
      const proxyUrl = 'https://api.cors.lol/?url=';
      
      // Build URL for latest available data (2025M08)
      const params = new URLSearchParams({
        'lang': 'sv',
        'valueCodes[ContentsCode]': '000002ZI', // Yearly change
        'valueCodes[VaruTjanstegrupp]': '01,02,03,04,05,06,07,08,09,10,11,12',
        'valueCodes[Tid]': '2025M08', // Latest available period
        'codelist[VaruTjanstegrupp]': 'vs_VaruTjänstegrCoicopA'
      });
      
      const scbUrl = `${this.baseUrl}?${params.toString()}`;
      const proxyedUrl = `${proxyUrl}${encodeURIComponent(scbUrl)}`;

      console.log('Fetching from SCB API:', scbUrl);
      
      const response = await fetch(proxyedUrl);
      
      if (!response.ok) {
        throw new Error(`SCB API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('SCB API Response:', data);
      
      return this.parseSCBV2Response(data);
      
    } catch (error) {
      console.error('SCB API fetch failed:', error);
      return null;
    }
  }

  private parseSCBV2Response(data: any): CPIData[] {
    try {
      // SCB v2beta API returns a different format
      if (!data || !data.data) {
        console.warn('No data found in SCB response');
        return [];
      }
      
      // Extract the data array
      const responseData = data.data;
      
      if (!Array.isArray(responseData) || responseData.length === 0) {
        console.warn('Invalid data format from SCB');
        return [];
      }
      
      // Build divisions object from the response
      const divisions: { [key: string]: number } = {};
      
      // Map COICOP codes to division keys
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
      
      // Parse each data point
      responseData.forEach((item: any) => {
        if (item.key && item.values && item.values.length > 0) {
          // Extract COICOP group from key
          const groupMatch = item.key.find((k: string) => /^\d{2}$/.test(k));
          if (groupMatch && groupMapping[groupMatch]) {
            const divisionKey = groupMapping[groupMatch];
            const value = parseFloat(item.values[0]);
            if (!isNaN(value)) {
              divisions[divisionKey] = value;
            }
          }
        }
      });
      
      // Check if we have enough data
      if (Object.keys(divisions).length < 10) {
        console.warn('Not enough division data parsed from SCB response');
        return [];
      }
      
      // Calculate average as total CPI (approximation)
      const avgValue = Object.values(divisions).reduce((sum, val) => sum + val, 0) / Object.values(divisions).length;
      
      // Create CPIData entry for August 2025
      return [{
        date: '2025-08',
        CPI_All: avgValue,
        divisions
      }];
      
    } catch (error) {
      console.error('Error parsing SCB v2beta response:', error);
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