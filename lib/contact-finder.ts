import axios from 'axios';

export interface ContactFinderResult {
  email?: string;
  phone?: string;
  confidence: number;
  source: string;
}

export class ContactFinder {
  // Hunter.io API for email finding
  private async findEmailWithHunter(name: string, domain: string): Promise<string | null> {
    try {
      // Note: You'll need to get a free API key from hunter.io
      const apiKey = process.env.HUNTER_API_KEY;
      if (!apiKey) {
        console.log('Hunter.io API key not found, skipping email search');
        return null;
      }

      const response = await axios.get(`https://api.hunter.io/v2/email-finder`, {
        params: {
          domain,
          first_name: name.split(' ')[0],
          last_name: name.split(' ').slice(1).join(' '),
          api_key: apiKey
        }
      });

      if (response.data.data && response.data.data.email) {
        return response.data.data.email;
      }
    } catch (error) {
      console.log('Hunter.io email search failed:', error);
    }
    return null;
  }

  // Apollo.io style contact finding (using public APIs)
  private async findContactWithApollo(name: string, company?: string): Promise<ContactFinderResult[]> {
    const results: ContactFinderResult[] = [];
    
    try {
      // Search for LinkedIn profiles first
      const linkedinUrl = await this.findLinkedInProfile(name, company);
      
      if (linkedinUrl) {
        // Extract company domain from LinkedIn
        const domain = await this.extractCompanyDomain(linkedinUrl);
        
        if (domain) {
          // Try to find email using common patterns
          const email = await this.generateEmailPatterns(name, domain);
          if (email) {
            results.push({
              email,
              confidence: 0.7,
              source: 'Email Pattern Generation'
            });
          }
        }
      }

      // Search for phone numbers using public directories
      const phone = await this.searchPhoneDirectories(name, company);
      if (phone) {
        results.push({
          phone,
          confidence: 0.6,
          source: 'Phone Directory Search'
        });
      }

    } catch (error) {
      console.log('Apollo-style contact search failed:', error);
    }

    return results;
  }

  // Find LinkedIn profile
  private async findLinkedInProfile(name: string, company?: string): Promise<string | null> {
    try {
      const searchQuery = company 
        ? `${name} ${company} site:linkedin.com/in/`
        : `${name} site:linkedin.com/in/`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: searchQuery
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].link;
      }
    } catch (error) {
      console.log('LinkedIn profile search failed:', error);
    }
    return null;
  }

  // Extract company domain from LinkedIn
  private async extractCompanyDomain(linkedinUrl: string): Promise<string | null> {
    try {
      const response = await axios.get(linkedinUrl);
      const html = response.data;
      
      // Look for company website in LinkedIn profile
      const websiteMatch = html.match(/https?:\/\/([^\/\s]+)/g);
      if (websiteMatch) {
        for (const url of websiteMatch) {
          if (!url.includes('linkedin.com') && !url.includes('google.com')) {
            return new URL(url).hostname;
          }
        }
      }
    } catch (error) {
      console.log('Domain extraction failed:', error);
    }
    return null;
  }

  // Generate email patterns
  private async generateEmailPatterns(name: string, domain: string): Promise<string | null> {
    const patterns = [
      `${name.toLowerCase().replace(' ', '.')}@${domain}`,
      `${name.toLowerCase().replace(' ', '')}@${domain}`,
      `${name.toLowerCase().split(' ')[0]}.${name.toLowerCase().split(' ')[1]}@${domain}`,
      `${name.toLowerCase().split(' ')[0]}@${domain}`,
      `${name.toLowerCase().split(' ')[1]}@${domain}`,
    ];

    // Test each pattern (this would require email validation service)
    for (const email of patterns) {
      if (await this.validateEmail(email)) {
        return email;
      }
    }
    return null;
  }

  // Simple email validation
  private async validateEmail(email: string): Promise<boolean> {
    // Basic regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Search phone directories
  private async searchPhoneDirectories(name: string, company?: string): Promise<string | null> {
    try {
      // Search public phone directories
      const searchQuery = company 
        ? `${name} ${company} phone number`
        : `${name} phone number`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: searchQuery
        }
      });

      if (response.data.items) {
        for (const item of response.data.items) {
          const phoneMatch = item.snippet.match(/\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
          if (phoneMatch) {
            return phoneMatch[0];
          }
        }
      }
    } catch (error) {
      console.log('Phone directory search failed:', error);
    }
    return null;
  }

  // Main contact finding method
  async findContacts(name: string, company?: string): Promise<ContactFinderResult[]> {
    const results: ContactFinderResult[] = [];

    // Method 1: Apollo-style contact finding
    const apolloResults = await this.findContactWithApollo(name, company);
    results.push(...apolloResults);

    // Method 2: Hunter.io email finding (if company domain is known)
    if (company) {
      const domain = await this.extractCompanyDomain(company);
      if (domain) {
        const hunterEmail = await this.findEmailWithHunter(name, domain);
        if (hunterEmail) {
          results.push({
            email: hunterEmail,
            confidence: 0.8,
            source: 'Hunter.io'
          });
        }
      }
    }

    // Method 3: Public records search
    const publicRecords = await this.searchPublicRecords(name, company);
    results.push(...publicRecords);

    return results;
  }

  // Search public records
  private async searchPublicRecords(name: string, company?: string): Promise<ContactFinderResult[]> {
    const results: ContactFinderResult[] = [];
    
    try {
      // Search for SEC filings if it's a public company
      if (company) {
        const secResults = await this.searchSECFilings(name, company);
        results.push(...secResults);
      }

      // Search for conference speaker information
      const conferenceResults = await this.searchConferenceSpeakers(name, company);
      results.push(...conferenceResults);

    } catch (error) {
      console.log('Public records search failed:', error);
    }

    return results;
  }

  // Search SEC filings for contact information
  private async searchSECFilings(name: string, company: string): Promise<ContactFinderResult[]> {
    const results: ContactFinderResult[] = [];
    
    try {
      const searchQuery = `${name} ${company} SEC filing contact`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: searchQuery
        }
      });

      if (response.data.items) {
        for (const item of response.data.items) {
          // Extract email and phone from SEC filings
          const emailMatch = item.snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          const phoneMatch = item.snippet.match(/\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
          
          if (emailMatch) {
            results.push({
              email: emailMatch[0],
              confidence: 0.9,
              source: 'SEC Filing'
            });
          }
          
          if (phoneMatch) {
            results.push({
              phone: phoneMatch[0],
              confidence: 0.9,
              source: 'SEC Filing'
            });
          }
        }
      }
    } catch (error) {
      console.log('SEC filings search failed:', error);
    }

    return results;
  }

  // Search conference speaker information
  private async searchConferenceSpeakers(name: string, company?: string): Promise<ContactFinderResult[]> {
    const results: ContactFinderResult[] = [];
    
    try {
      const searchQuery = company 
        ? `${name} ${company} conference speaker contact`
        : `${name} conference speaker contact`;
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: searchQuery
        }
      });

      if (response.data.items) {
        for (const item of response.data.items) {
          const emailMatch = item.snippet.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          const phoneMatch = item.snippet.match(/\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
          
          if (emailMatch) {
            results.push({
              email: emailMatch[0],
              confidence: 0.7,
              source: 'Conference Speaker'
            });
          }
          
          if (phoneMatch) {
            results.push({
              phone: phoneMatch[0],
              confidence: 0.7,
              source: 'Conference Speaker'
            });
          }
        }
      }
    } catch (error) {
      console.log('Conference speaker search failed:', error);
    }

    return results;
  }
}

export const contactFinder = new ContactFinder(); 