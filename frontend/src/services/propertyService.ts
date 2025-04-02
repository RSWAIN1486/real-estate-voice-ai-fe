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
      console.log('Initializing properties from CSV...');
      const response = await fetch('/properties_rows.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvData = await response.text();
      console.log('CSV data loaded, first 100 chars:', csvData.substring(0, 100));
      this.loadProperties(csvData);
    } catch (error: unknown) {
      console.error('Error loading properties:', error);
    }
  }

  private loadProperties(csvData: string) {
    console.log('Parsing CSV data...');
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        this.properties = results.data.map((row: any) => ({
          ...row,
          bedrooms: Number(row.bedrooms),
          bathrooms: Number(row.bathrooms),
          is_rental: row.is_rental === 'true'
        }));
        console.log('Properties loaded successfully:', {
          count: this.properties.length,
          firstProperty: this.properties[0],
          lastProperty: this.properties[this.properties.length - 1]
        });
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }

  searchProperties(query: string): Property[] {
    console.log('Searching properties with query:', query);
    console.log('Current number of properties:', this.properties.length);

    // Convert query to lowercase for case-insensitive search
    const searchTerms = query.toLowerCase()
      .split(' ')
      .filter(term => {
        // Remove common words and punctuation
        const commonWords = ['could', 'you', 'list', 'down', 'the', 'top', 'three', 'five', 'properties', 'for', 'in', 'please', 'show', 'me', 'find', 'search', '?', '.', ','];
        return !commonWords.includes(term);
      });
    console.log('Filtered search terms:', searchTerms);

    // Filter properties based on search terms
    const results = this.properties.filter(property => {
      // Create a searchable string from property details
      const propertyString = `${property.location} ${property.property_type} ${property.price_display} ${property.is_rental ? 'rent rental' : 'sale buy'} ${property.bedrooms} bedrooms ${property.bathrooms} bathrooms ${property.amenities}`.toLowerCase();
      
      // For rental properties, we need both "rent" and location to match
      if (searchTerms.includes('rent') || searchTerms.includes('rental')) {
        return property.is_rental && 
               searchTerms.every(term => 
                 term === 'rent' || term === 'rental' || propertyString.includes(term)
               );
      }
      
      // For sale properties
      if (searchTerms.includes('sale') || searchTerms.includes('buy')) {
        return !property.is_rental && 
               searchTerms.every(term => 
                 term === 'sale' || term === 'buy' || propertyString.includes(term)
               );
      }
      
      // If no rent/sale specified, match other terms
      return searchTerms.every(term => propertyString.includes(term));
    })
    .slice(0, 5); // Return only top 5 results

    console.log('Search results:', results);
    return results;
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

    console.log('Waiting for properties to load...');
    // Wait for properties to load with timeout
    const timeout = 10000; // 10 seconds timeout
    const startTime = Date.now();

    while (!this.isLoaded() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.isLoaded()) {
      throw new Error('Timeout waiting for properties to load');
    }
    console.log('Properties loaded successfully after waiting');
  }
}

export const propertyService = new PropertyService(); 