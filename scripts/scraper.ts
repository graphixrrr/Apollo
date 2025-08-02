#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  const args = process.argv.slice(2);
  const query = args[0];

  if (!query) {
    console.log('Usage: pnpm scrape "search query"');
    console.log('Example: pnpm scrape "John Smith CEO"');
    process.exit(1);
  }

  console.log(`🔍 Searching for: "${query}"`);
  console.log('⏳ This may take a few minutes...\n');

  try {
    const result = await scraper.scrapeContacts(query, 20);

    if (result.success) {
      console.log(`✅ Found ${result.contacts.length} contacts:\n`);
      
      result.contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
        if (contact.title) console.log(`   Title: ${contact.title}`);
        if (contact.company) console.log(`   Company: ${contact.company}`);
        if (contact.email) console.log(`   Email: ${contact.email}`);
        if (contact.phone) console.log(`   Phone: ${contact.phone}`);
        if (contact.location) console.log(`   Location: ${contact.location}`);
        console.log(`   Confidence: ${Math.round(contact.confidence * 100)}%`);
        console.log(`   Source: ${contact.source}`);
        console.log('');
      });

      if (result.errors.length > 0) {
        console.log('⚠️  Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.log('❌ Scraping failed');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

main(); 