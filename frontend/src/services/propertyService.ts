import Papa from 'papaparse';

interface Property {
  id: string;
  area_display: string;
  price_display: string;
  bedrooms: number;
  location: string;
  bathrooms: number;
  property_type: string;
  created_at: string;
  area_sqft: string;
  price_value: string;
  price_per_sqft: string;
  is_rental: boolean;
  amenities: string;
  available_from: string;
}

class PropertyService {
  private properties: Property[] = [];

  constructor() {
    // Load the CSV data when service is instantiated
    this.initializeProperties();
  }

  private async initializeProperties() {
    try {
      const response = await fetch('/properties_rows.csv');
      const csvData = await response.text();
      this.loadProperties(csvData);
    } catch (error: unknown) {
      console.error('Error loading properties:', error);
    }
  }

  private loadProperties(csvData: string) {
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        this.properties = results.data.map((row: any) => ({
          ...row,
          bedrooms: Number(row.bedrooms),
          bathrooms: Number(row.bathrooms),
          is_rental: row.is_rental === 'true'
        }));
        console.log('Properties loaded:', this.properties.length);
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }

  searchProperties(query: string): Property[] {
    // Convert query to lowercase for case-insensitive search
    const searchTerms = query.toLowerCase().split(' ');

    // Filter properties based on search terms
    return this.properties.filter(property => {
      const propertyString = `${property.location} ${property.property_type} ${property.price_display} ${property.is_rental ? 'rent rental' : 'sale buy'} ${property.bedrooms} bedrooms ${property.bathrooms} bathrooms ${property.amenities}`.toLowerCase();
      
      // Check if all search terms are present
      return searchTerms.every(term => propertyString.includes(term));
    })
    .slice(0, 5); // Return only top 5 results
  }

  // Add a method to check if properties are loaded
  isLoaded(): boolean {
    return this.properties.length > 0;
  }

  // Add a method to wait for properties to load
  async waitForProperties(): Promise<void> {
    if (this.isLoaded()) {
      return;
    }

    // Wait for properties to load with timeout
    const timeout = 10000; // 10 seconds timeout
    const startTime = Date.now();

    while (!this.isLoaded() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.isLoaded()) {
      throw new Error('Timeout waiting for properties to load');
    }
  }
}

export const propertyService = new PropertyService(); 