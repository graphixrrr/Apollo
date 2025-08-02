#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  console.log('🔍 Debugging Search Functionality');
  console.log('==================================\n');

  const testQuery = "John Smith";

  try {
    console.log(`Testing search for: "${testQuery}"`);
    
    // Test browser initialization
    console.log('1. Initializing browser...');
    await scraper.initialize();
    console.log('✅ Browser initialized successfully');
    
    // Test the search function directly
    console.log('2. Testing search function...');
    const urls = await scraper.searchYCFounderSources(testQuery);
    console.log(`✅ Search completed. Found ${urls.length} URLs`);
    
    if (urls.length > 0) {
      console.log('Sample URLs found:');
      urls.slice(0, 5).forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    } else {
      console.log('❌ No URLs found - this indicates a search issue');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

main(); 