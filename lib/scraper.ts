import axios from 'axios';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { Contact, ScrapingResult } from './types';
import { contactFinder, ContactFinderResult } from './contact-finder';

export class WebScraper {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Users/srimanpanchangam/.cache/puppeteer/chrome/mac_arm-138.0.7204.168/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Extract phone numbers from text using regex patterns
  private extractPhoneNumbers(text: string): string[] {
    const phonePatterns = [
      // US/Canada format: (123) 456-7890
      /\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      // International format: +1-123-456-7890
      /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      // Simple format: 123-456-7890
      /([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      // Extension format: 123-456-7890 x123
      /([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\s*(?:x|ext|extension)?\s*([0-9]+)/gi,
      // Direct line format: Direct: 123-456-7890
      /(?:direct|office|phone|tel)[:\s]*([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/gi,
    ];

    const phones: string[] = [];
    
    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        phones.push(...matches);
      }
    }

    return [...new Set(phones)]; // Remove duplicates
  }

  // Extract addresses from text (including home addresses)
  private extractAddresses(text: string): string[] {
    const addressPatterns = [
      // Street address with city, state, zip
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g,
      // City, State format
      /[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g,
      // Office address patterns
      /(?:office|address|location)[:\s]*([^.\n]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)[^.\n]*)/gi,
      // Home address patterns
      /(?:home|residence|lives at|address)[:\s]*([^.\n]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)[^.\n]*)/gi,
      // Personal address patterns
      /(?:personal|private|residential)[:\s]*([^.\n]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)[^.\n]*)/gi,
      // Founder address patterns
      /(?:founder|co-founder|CEO|founder's)[:\s]*([^.\n]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)[^.\n]*)/gi,
    ];

    const addresses: string[] = [];
    
    for (const pattern of addressPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        addresses.push(...matches);
      }
    }

    return [...new Set(addresses)].filter(addr => addr.length > 10 && addr.length < 200); // Remove duplicates and filter by length
  }

  // Extract email addresses from text
  private extractEmails(text: string): string[] {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailPattern) || [];
    return [...new Set(emails)]; // Remove duplicates
  }

  // Extract names from text using various patterns
  private extractNames(text: string): { firstName: string; lastName: string }[] {
    const namePatterns = [
      // Full name: "John Doe" or "John M. Doe"
      /([A-Z][a-z]+)\s+([A-Z][a-z]+)/g,
      // With middle initial: "John M Doe"
      /([A-Z][a-z]+)\s+[A-Z]\.\s+([A-Z][a-z]+)/g,
      // Three word names: "John Michael Doe"
      /([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/g,
      // Names with titles: "Mr. John Doe" or "Dr. John Doe"
      /(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/gi,
      // Names in quotes: "John Doe"
      /"([A-Z][a-z]+)\s+([A-Z][a-z]+)"/g,
      // Names in parentheses: (John Doe)
      /\(([A-Z][a-z]+)\s+([A-Z][a-z]+)\)/g,
    ];

    const names: { firstName: string; lastName: string }[] = [];
    
    for (const pattern of namePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        // Handle different pattern groups
        let firstName = '';
        let lastName = '';
        
        if (match.length >= 3) {
          if (pattern.source.includes('Mr\\.|Mrs\\.|Ms\\.|Dr\\.|Prof\\.')) {
            // Title pattern
            firstName = match[1];
            lastName = match[2];
          } else if (pattern.source.includes('\\s+[A-Z]\\.\\s+')) {
            // Middle initial pattern
            firstName = match[1];
            lastName = match[2];
          } else if (pattern.source.includes('\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+')) {
            // Three word pattern - use first and last
            firstName = match[1];
            lastName = match[3];
          } else {
            // Standard two word pattern
            firstName = match[1];
            lastName = match[2];
          }
        }
        
        if (firstName && lastName && 
            firstName.length > 1 && lastName.length > 1 &&
            firstName !== lastName) {
          names.push({
            firstName,
            lastName,
          });
        }
      }
    }

    // Remove duplicates
    const uniqueNames = names.filter((name, index, self) => 
      index === self.findIndex(n => 
        n.firstName.toLowerCase() === name.firstName.toLowerCase() && 
        n.lastName.toLowerCase() === name.lastName.toLowerCase()
      )
    );

    return uniqueNames;
  }

  // Scrape a single webpage for contact information
  async scrapeWebpage(url: string, source: string): Promise<Contact[]> {
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      
      // Set user agent to avoid being blocked
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get the page content
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract text content
      const textContent = $('body').text();
      
      // Extract contact information
      const phones = this.extractPhoneNumbers(textContent);
      const emails = this.extractEmails(textContent);
      const names = this.extractNames(textContent);
      const addresses = this.extractAddresses(textContent);
      
      // Extract company information from multiple sources
      const companySelectors = [
        'h1', 'h2', 'h3', '.company-name', '.brand', '.logo-text',
        '[class*="company"]', '[class*="brand"]', '[class*="logo"]',
        '.organization', '.business-name', '.corporate-name',
        'title', 'meta[property="og:site_name"]'
      ];
      
      let company = '';
      for (const selector of companySelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          company = element.text().trim() || element.attr('content') || '';
          if (company && company.length > 2 && company.length < 100) break;
        }
      }
      
      // Extract job titles
      const titleSelectors = [
        '.title', '.job-title', '.position', '.role',
        '[class*="title"]', '[class*="position"]', '[class*="role"]',
        'h4', 'h5', 'h6'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          title = element.text().trim();
          if (title && title.length > 2 && title.length < 100) break;
        }
      }
      
      // Extract location information
      const locationSelectors = [
        '.location', '.address', '.city', '.state',
        '[class*="location"]', '[class*="address"]'
      ];
      
      let location = '';
      for (const selector of locationSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          location = element.text().trim();
          if (location && location.length > 2 && location.length < 100) break;
        }
      }
      
      // Create contacts from found information
      const contacts: Contact[] = [];
      
      // If we found names, create contacts for each
      if (names.length > 0) {
        for (const name of names) {
          // Create multiple contact variations with different combinations of info
          const contactVariations = [
            {
              email: emails[0] || undefined,
              phone: phones[0] || undefined,
            },
            {
              email: emails[1] || undefined,
              phone: phones[1] || undefined,
            },
            {
              email: emails[2] || undefined,
              phone: phones[2] || undefined,
            }
          ];
          
          for (const variation of contactVariations) {
            if (variation.email || variation.phone) {
              // Create contact with address information
              const contact = {
                id: `temp_${Date.now()}_${Math.random()}`,
                firstName: name.firstName,
                lastName: name.lastName,
                email: variation.email,
                phone: variation.phone,
                company: company || undefined,
                title: title || undefined,
                linkedinUrl: undefined,
                website: url,
                location: location || undefined,
                industry: undefined,
                notes: `Found on ${source} - CEO contact search`,
                tags: JSON.stringify(['web-scraped', 'ceo-search']),
                source,
                confidence: 0.8,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Add address information to notes if found
              if (addresses.length > 0) {
                contact.notes += ` | Found Addresses: ${addresses.slice(0, 3).join(', ')}`;
              }
              
              // Add founder-specific tags
              contact.tags = JSON.stringify(['web-scraped', 'yc-founder', 'startup-founder']);

              contacts.push(contact);
            }
          }
        }
      } else if (phones.length > 0 || emails.length > 0) {
        // If no names found but we have contact info, create contacts for each phone/email
        for (let i = 0; i < Math.max(phones.length, emails.length); i++) {
          contacts.push({
            id: `temp_${Date.now()}_${Math.random()}`,
            firstName: 'Unknown',
            lastName: 'Contact',
            email: emails[i] || undefined,
            phone: phones[i] || undefined,
            company: company || undefined,
            title: title || undefined,
            linkedinUrl: undefined,
            website: url,
            location: location || undefined,
            industry: undefined,
            notes: `Found on ${source} - No name provided`,
            tags: JSON.stringify(['web-scraped', 'no-name']),
            source,
            confidence: 0.6,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
      
      await page.close();
      return contacts;
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
            return [];
    }
  }

  // Search for YC founder contact information using targeted sources
  async searchYCFounderSources(query: string): Promise<string[]> {
    const allUrls: string[] = [];
    
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Targeted search queries for YC founder contact information
      const searchQueries = [
        `${query} Y Combinator founder`,
        `${query} YC founder contact`,
        `${query} Y Combinator startup founder`,
        `${query} YC alumni contact`,
        `${query} founder email address`,
        `${query} founder phone number`,
        `${query} founder personal contact`,
        `${query} founder home address`,
        `${query} founder LinkedIn profile`,
        `${query} founder contact information`,
        `${query} startup founder contact`,
        `${query} founder direct contact`,
        `${query} founder personal email`,
        `${query} founder business contact`,
        `${query} founder contact details`,
        `${query} founder office location`,
        `${query} founder direct line`,
        `${query} founder executive assistant`,
        `${query} founder contact page`,
        `${query} founder address location`
      ];

      for (const searchQuery of searchQueries) {
        try {
          console.log(`Searching for: "${searchQuery}"`);
          
          // Google search with more results
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=30`;
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait a bit for the page to load
          await page.waitForTimeout(2000);
          
          // Extract search results with better selectors
          const urls = await page.evaluate(() => {
            // Try multiple selectors for search results
            const selectors = [
              'div.g a[href]',
              'h3 a[href]',
              'a[href]',
              '.yuRUbf a[href]',
              '.rc a[href]'
            ];
            
            let allLinks: HTMLAnchorElement[] = [];
            
            for (const selector of selectors) {
              const links = Array.from(document.querySelectorAll(selector)) as HTMLAnchorElement[];
              allLinks = allLinks.concat(links);
            }
            
            // Remove duplicates and filter
            const uniqueLinks = [...new Set(allLinks)];
            
            return uniqueLinks
              .map(link => link.href)
              .filter(href => href.startsWith('http') && 
                !href.includes('google.com') && 
                !href.includes('youtube.com') &&
                !href.includes('facebook.com') &&
                !href.includes('twitter.com') &&
                !href.includes('instagram.com') &&
                !href.includes('reddit.com') &&
                !href.includes('maps.google.com'))
              .slice(0, 20); // Get more results per query
          });
          
          console.log(`Found ${urls.length} URLs for "${searchQuery}"`);
          allUrls.push(...urls);
          
          // Add delay to avoid rate limiting
          await page.waitForTimeout(2000);
          
        } catch (error) {
          console.error(`Error searching for "${searchQuery}":`, error);
        }
      }
      
      await page.close();
      
      // Remove duplicates and return unique URLs
      const uniqueUrls = [...new Set(allUrls)];
      
      // If no URLs found, try a simpler search approach
      if (uniqueUrls.length === 0) {
        console.log('No URLs found with detailed search, trying simple search...');
        return await this.simpleSearch(query);
      }
      
      return uniqueUrls;
      
    } catch (error) {
      console.error('Error in YC founder source search:', error);
      // Try fallback search
      console.log('Trying fallback search...');
      return await this.simpleSearch(query);
    }
  }

  // Simple fallback search method
  async simpleSearch(query: string): Promise<string[]> {
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links
          .map(link => (link as HTMLAnchorElement).href)
          .filter(href => href.startsWith('http') && 
            !href.includes('google.com') && 
            !href.includes('youtube.com'))
          .slice(0, 10);
      });
      
      await page.close();
      console.log(`Simple search found ${urls.length} URLs`);
      return urls;
      
    } catch (error) {
      console.error('Error in simple search:', error);
      return [];
    }
  }

  // Main contact finding method using real contact finder services
  async findContactInfo(name: string, company?: string): Promise<Contact[]> {
    const contacts: Contact[] = [];
    
    try {
      console.log(`🔍 Finding contact info for: ${name}${company ? ` at ${company}` : ''}`);
      
      // Use the contact finder service
      const results = await contactFinder.findContacts(name, company);
      
      console.log(`✅ Found ${results.length} contact results`);
      
      // Convert results to Contact objects
      for (const result of results) {
        const contact: Contact = {
          id: `contact_${Date.now()}_${Math.random()}`,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          email: result.email,
          phone: result.phone,
          company: company || undefined,
          title: undefined,
          linkedinUrl: undefined,
          website: undefined,
          location: undefined,
          industry: undefined,
          notes: `Found via ${result.source}`,
          tags: JSON.stringify(['contact-finder', 'real-data']),
          source: result.source,
          confidence: result.confidence,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        contacts.push(contact);
      }
      
      // If no results from contact finder, try web scraping as fallback
      if (contacts.length === 0) {
        console.log('No results from contact finder, trying web scraping...');
        const webScrapedContacts = await this.scrapeContacts(name, 10);
        if (webScrapedContacts.success) {
          contacts.push(...webScrapedContacts.contacts);
        }
      }
      
    } catch (error) {
      console.error('Error finding contact info:', error);
    }
    
    return contacts;
  }

  // Legacy web scraping method (kept as fallback)
  async scrapeContacts(query: string, maxResults: number = 50): Promise<ScrapingResult> {
    const contacts: Contact[] = [];
    const errors: string[] = [];
    
    try {
      // Search for relevant URLs using YC founder-specific sources
      const searchUrls = await this.searchYCFounderSources(query);
      
      console.log(`Found ${searchUrls.length} URLs to scrape for "${query}" YC founder contact information`);
      
      // Scrape each URL
      for (const url of searchUrls.slice(0, Math.min(searchUrls.length, 100))) {
        try {
          console.log(`Scraping: ${url}`);
          const pageContacts = await this.scrapeWebpage(url, 'YC Founder Contact Search');
          contacts.push(...pageContacts);
          
          if (contacts.length >= maxResults) {
            break;
          }
        } catch (error) {
          errors.push(`Failed to scrape ${url}: ${error}`);
        }
      }
      
      // Remove duplicates based on email or phone
      const uniqueContacts = contacts.filter((contact, index, self) => {
        if (!contact.email && !contact.phone) return true;
        return index === self.findIndex(c => 
          (c.email && c.email === contact.email) || 
          (c.phone && c.phone === contact.phone)
        );
      });
      
      return {
        success: true,
        contacts: uniqueContacts.slice(0, maxResults),
        errors,
        totalFound: uniqueContacts.length,
      };
      
    } catch (error) {
      errors.push(`Scraping failed: ${error}`);
      return {
        success: false,
        contacts: [],
        errors,
        totalFound: 0,
      };
    }
  }
}

// Export singleton instance
export const scraper = new WebScraper(); 