#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  console.log('🚀 Testing Enhanced Apollo AI Scraper');
  console.log('=====================================\n');

  const testQueries = [
    'Jon Jones',
    'John Smith CEO',
    'Marketing Director'
  ];

  for (const query of testQueries) {
    console.log(`🔍 Testing: "${query}"`);
    console.log('⏳ Searching multiple sources...\n');

    try {
      // Test the search function first
      const searchUrls = await scraper.searchMultipleSources(query);
      console.log(`📊 Found ${searchUrls.length} URLs to scrape`);
      
      if (searchUrls.length > 0) {
        console.log('🌐 Sample URLs found:');
        searchUrls.slice(0, 5).forEach((url, index) => {
          console.log(`   ${index + 1}. ${url}`);
        });
        console.log('');
      }

      // Test scraping with limited results for speed
      const result = await scraper.scrapeContacts(query, 10);

      if (result.success && result.contacts.length > 0) {
        console.log(`✅ Found ${result.contacts.length} contacts for "${query}":\n`);
        
        result.contacts.slice(0, 3).forEach((contact, index) => {
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

        if (result.contacts.length > 3) {
          console.log(`... and ${result.contacts.length - 3} more contacts found!\n`);
        }
      } else {
        console.log(`❌ No contacts found for "${query}"\n`);
      }

      if (result.errors.length > 0) {
        console.log('⚠️  Some errors encountered:');
        result.errors.slice(0, 3).forEach(error => console.log(`   - ${error}`));
        console.log('');
      }

    } catch (error) {
      console.error(`❌ Error testing "${query}":`, error);
      console.log('');
    }

    console.log('-------------------------------------\n');
  }

  console.log('🎉 Enhanced scraper test completed!');
  console.log('\n💡 The scraper now searches:');
  console.log('   • Multiple Google search queries');
  console.log('   • Contact information pages');
  console.log('   • LinkedIn profiles');
  console.log('   • Company directories');
  console.log('   • Professional listings');
  console.log('   • And much more!');
  
  console.log('\n🚀 To use the full scraper:');
  console.log('   • Web interface: http://localhost:3000');
  console.log('   • Command line: pnpm scrape "Jon Jones"');

  await scraper.close();
  process.exit(0);
}

main(); 