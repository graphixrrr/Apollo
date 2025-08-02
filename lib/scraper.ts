import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { Contact, ScrapingResult } from './types';

export class WebScraper {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
    ];

    const names: { firstName: string; lastName: string }[] = [];
    
    for (const pattern of namePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        names.push({
          firstName: match[1],
          lastName: match[2],
        });
      }
    }

    return names;
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
      
      // Extract company information
      const companySelectors = [
        'h1', 'h2', 'h3', '.company-name', '.brand', '.logo-text',
        '[class*="company"]', '[class*="brand"]', '[class*="logo"]'
      ];
      
      let company = '';
      for (const selector of companySelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          company = element.text().trim();
          if (company) break;
        }
      }
      
      // Create contacts from found information
      const contacts: Contact[] = [];
      
      // If we found names, create contacts for each
      if (names.length > 0) {
        for (const name of names) {
          contacts.push({
            id: `temp_${Date.now()}_${Math.random()}`,
            firstName: name.firstName,
            lastName: name.lastName,
            email: emails[0] || undefined,
            phone: phones[0] || undefined,
            company: company || undefined,
            title: undefined,
            linkedinUrl: undefined,
            website: url,
            location: undefined,
            industry: undefined,
            notes: `Found on ${source}`,
            tags: JSON.stringify(['web-scraped']),
            source,
            confidence: 0.7,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else if (phones.length > 0 || emails.length > 0) {
        // If no names found but we have contact info, create a generic contact
        contacts.push({
          id: `temp_${Date.now()}_${Math.random()}`,
          firstName: 'Unknown',
          lastName: 'Contact',
          email: emails[0] || undefined,
          phone: phones[0] || undefined,
          company: company || undefined,
          title: undefined,
          linkedinUrl: undefined,
          website: url,
          location: undefined,
          industry: undefined,
                      notes: `Found on ${source} - No name provided`,
            tags: JSON.stringify(['web-scraped', 'no-name']),
            source,
          confidence: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      await page.close();
      return contacts;
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return [];
    }
  }

  // Search for contacts using Google search
  async searchGoogle(query: string): Promise<string[]> {
    try {
      await this.initialize();
      
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Search Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract search results
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links
          .map(link => (link as HTMLAnchorElement).href)
          .filter(href => href.startsWith('http') && !href.includes('google.com'))
          .slice(0, 10); // Limit to first 10 results
      });
      
      await page.close();
      return urls;
      
    } catch (error) {
      console.error('Error searching Google:', error);
      return [];
    }
  }

  // Main scraping function
  async scrapeContacts(query: string, maxResults: number = 50): Promise<ScrapingResult> {
    const contacts: Contact[] = [];
    const errors: string[] = [];
    
    try {
      // Search for relevant URLs
      const searchUrls = await this.searchGoogle(query);
      
      // Scrape each URL
      for (const url of searchUrls.slice(0, Math.min(searchUrls.length, 10))) {
        try {
          const pageContacts = await this.scrapeWebpage(url, 'Google Search');
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