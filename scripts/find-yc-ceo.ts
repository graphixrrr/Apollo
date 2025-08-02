#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  console.log('🎯 Y Combinator CEO Contact Finder');
  console.log('===================================\n');

  const searchQueries = [
    'Y Combinator CEO',
    'Y Combinator Sam Altman',
    'Y Combinator Garry Tan',
    'Y Combinator president',
    'Y Combinator founder contact'
  ];

  const allContacts: any[] = [];

  for (const query of searchQueries) {
    console.log(`🔍 Searching for: "${query}"`);
    console.log('⏳ This may take a few minutes...\n');

    try {
      const result = await scraper.scrapeContacts(query, 20);

      if (result.success && result.contacts.length > 0) {
        console.log(`✅ Found ${result.contacts.length} contacts for "${query}":\n`);
        
        result.contacts.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
          if (contact.title) console.log(`   Title: ${contact.title}`);
          if (contact.company) console.log(`   Company: ${contact.company}`);
          if (contact.email) console.log(`   Email: ${contact.email}`);
          if (contact.phone) console.log(`   Phone: ${contact.phone}`);
          if (contact.location) console.log(`   Location: ${contact.location}`);
          if (contact.notes && contact.notes.includes('Addresses:')) {
            console.log(`   Addresses: ${contact.notes.split('Addresses:')[1]}`);
          }
          console.log(`   Confidence: ${Math.round(contact.confidence * 100)}%`);
          console.log(`   Source: ${contact.source}`);
          console.log('');

          allContacts.push(contact);
        });
      } else {
        console.log(`❌ No contacts found for "${query}"\n`);
      }

      if (result.errors.length > 0) {
        console.log('⚠️  Errors encountered:');
        result.errors.forEach(error => console.log(`   - ${error}`));
        console.log('');
      }

    } catch (error) {
      console.error(`❌ Error searching for "${query}":`, error);
      console.log('');
    }

    console.log('-------------------------------------\n');
  }

  // Summary of all findings
  console.log('📊 SUMMARY OF Y COMBINATOR CEO CONTACTS');
  console.log('=======================================\n');

  if (allContacts.length > 0) {
    console.log(`Total contacts found: ${allContacts.length}\n`);

    // Group by contact type
    const emails = allContacts.filter(c => c.email).map(c => c.email);
    const phones = allContacts.filter(c => c.phone).map(c => c.phone);
    const addresses = allContacts.filter(c => c.notes && c.notes.includes('Addresses:'));

    console.log('📧 EMAIL ADDRESSES:');
    [...new Set(emails)].forEach(email => console.log(`   • ${email}`));
    console.log('');

    console.log('📞 PHONE NUMBERS:');
    [...new Set(phones)].forEach(phone => console.log(`   • ${phone}`));
    console.log('');

    if (addresses.length > 0) {
      console.log('🏠 ADDRESSES:');
      addresses.forEach(contact => {
        const addressPart = contact.notes.split('Addresses:')[1];
        console.log(`   • ${addressPart}`);
      });
      console.log('');
    }

    console.log('🎯 HIGHEST CONFIDENCE CONTACTS:');
    const highConfidence = allContacts
      .filter(c => c.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    highConfidence.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.firstName} ${contact.lastName} (${Math.round(contact.confidence * 100)}%)`);
      if (contact.email) console.log(`   Email: ${contact.email}`);
      if (contact.phone) console.log(`   Phone: ${contact.phone}`);
      console.log('');
    });

  } else {
    console.log('❌ No Y Combinator CEO contacts found');
  }

  console.log('💡 Tips for finding more information:');
  console.log('   • Check Y Combinator\'s official website');
  console.log('   • Look for SEC filings and company documents');
  console.log('   • Search professional directories');
  console.log('   • Check LinkedIn profiles');
  console.log('   • Look for conference speaker information');

  await scraper.close();
  process.exit(0);
}

main(); 