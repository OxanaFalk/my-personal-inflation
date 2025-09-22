// SCB PXWeb API service for fetching Swedish CPI data
export interface CPIData {
  date: string;
  CPI_All: number;
  divisions: {
    [key: string]: number;
  };
}

// COICOP division mapping with explanations
export const DIVISIONS = {
  '01_Food': { 
    code: '01', 
    name: 'Food and non-alcoholic beverages',
    description: 'Groceries, beverages, and basic food items'
  },
  '02_AlcoholTobacco': { 
    code: '02', 
    name: 'Alcoholic beverages, tobacco and narcotics',
    description: 'Alcoholic drinks, tobacco products, and related items'
  },
  '03_Clothing': { 
    code: '03', 
    name: 'Clothing and footwear',
    description: 'Clothes, shoes, and fashion accessories'
  },
  '04_Housing': { 
    code: '04', 
    name: 'Housing, water, electricity, gas and other fuels',
    description: 'Rent, utilities, home energy costs'
  },
  '05_Furnishings': { 
    code: '05', 
    name: 'Furnishings, household equipment and routine household maintenance',
    description: 'Furniture, appliances, home maintenance'
  },
  '06_Health': { 
    code: '06', 
    name: 'Health',
    description: 'Medical expenses, healthcare, pharmaceuticals'
  },
  '07_Transport': { 
    code: '07', 
    name: 'Transport',
    description: 'Cars, fuel, public transport, travel'
  },
  '08_Communication': { 
    code: '08', 
    name: 'Information and communication',
    description: 'Phone, internet, postal services'
  },
  '09_Recreation': { 
    code: '09', 
    name: 'Recreation, sport and culture',
    description: 'Entertainment, hobbies, sports, cultural activities'
  },
  '10_Education': { 
    code: '10', 
    name: 'Education services',
    description: 'School fees, courses, educational materials'
  },
  '11_RestaurantsHotels': { 
    code: '11', 
    name: 'Restaurants and accommodation services',
    description: 'Dining out, hotels, accommodation'
  },
  '12_Misc': { 
    code: '12', 
    name: 'Personal care, social protection and miscellaneous',
    description: 'Insurance, personal care, financial services'
  }
} as const;

// Swedish average spending weights from CSV data (converted from decimals to percentages)
export const SWEDEN_AVERAGE_WEIGHTS = {
  '01_Food': 13.9,
  '02_AlcoholTobacco': 3.2,
  '03_Clothing': 4.5,
  '04_Housing': 25.1,
  '05_Furnishings': 5.8,
  '06_Health': 3.1,
  '07_Transport': 13.2,
  '08_Communication': 2.8,
  '09_Recreation': 12.4,
  '10_Education': 0.3,
  '11_RestaurantsHotels': 8.6,
  '12_Misc': 7.1,
};

class SCBService {
  private readonly baseUrl = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020COICOP2M';
  
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
    const query = {
      "query": [
        {
          "code": "ContentsCode",
          "selection": {
            "filter": "item",
            "values": ["PR0101N1"]
          }
        }
      ],
      "response": {
        "format": "json-stat2"
      }
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`SCB API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseSCBResponse(data);
    } catch (error) {
      console.error('SCB API fetch failed:', error);
      return null;
    }
  }

  private parseSCBResponse(data: any): CPIData[] {
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
      const values = line.split(',');
      const divisions: { [key: string]: number } = {};
      
      // Parse date and CPI_Total
      const dateStr = values[0].trim(); // Keep original format like "2024M09"
      const cpiTotal = parseFloat(values[1]);
      
      // Extract division inflation rates (columns 2-13)
      const divisionHeaders = headers.slice(2, 14); // Only inflation columns, not weights
      divisionHeaders.forEach((header, index) => {
        const value = parseFloat(values[index + 2]);
        divisions[header.trim()] = value;
      });
      
      return {
        date: dateStr, // Keep original "2024M09" format
        CPI_All: cpiTotal,
        divisions
      };
    });
  }
}

export const scbService = new SCBService();