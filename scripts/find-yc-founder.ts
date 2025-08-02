#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  const args = process.argv.slice(2);
  const founderName = args[0];

  if (!founderName) {
    console.log('🎯 Y Combinator Founder Contact Finder');
    console.log('=======================================\n');
    console.log('Usage: pnpm find-yc-founder "Founder Name"');
    console.log('Example: pnpm find-yc-founder "John Smith"');
    console.log('Example: pnpm find-yc-founder "Jane Doe"');
    console.log('\nThis will search for:');
    console.log('• Phone numbers (personal & business)');
    console.log('• Email addresses (personal & business)');
    console.log('• Home addresses');
    console.log('• Office addresses');
    console.log('• LinkedIn profiles');
    console.log('• Company information');
    process.exit(1);
  }

  console.log(`🎯 Searching for YC Founder: "${founderName}"`);
  console.log('=============================================\n');

  const searchQueries = [
    founderName,
    `${founderName} Y Combinator`,
    `${founderName} YC founder`,
    `${founderName} startup founder`,
    `${founderName} YC alumni`,
    `${founderName} co-founder`,
    `${founderName} CEO founder`
  ];

  const allContacts: any[] = [];

  for (const query of searchQueries) {
    console.log(`🔍 Searching: "${query}"`);
    console.log('⏳ This may take a few minutes...\n');

    try {
      const result = await scraper.scrapeContacts(query, 30);

      if (result.success && result.contacts.length > 0) {
        console.log(`✅ Found ${result.contacts.length} contacts for "${query}":\n`);
        
        result.contacts.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
          if (contact.title) console.log(`   Title: ${contact.title}`);
          if (contact.company) console.log(`   Company: ${contact.company}`);
          if (contact.email) console.log(`   Email: ${contact.email}`);
          if (contact.phone) console.log(`   Phone: ${contact.phone}`);
          if (contact.location) console.log(`   Location: ${contact.location}`);
          if (contact.notes && contact.notes.includes('Found Addresses:')) {
            console.log(`   Addresses: ${contact.notes.split('Found Addresses:')[1]}`);
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
        console.log('⚠️  Some errors encountered:');
        result.errors.slice(0, 3).forEach(error => console.log(`   - ${error}`));
        console.log('');
      }

    } catch (error) {
      console.error(`❌ Error searching for "${query}":`, error);
      console.log('');
    }

    console.log('-------------------------------------\n');
  }

  // Summary of all findings
  console.log('📊 SUMMARY OF FOUNDER CONTACT INFORMATION');
  console.log('==========================================\n');

  if (allContacts.length > 0) {
    console.log(`Total contacts found: ${allContacts.length}\n`);

    // Group by contact type
    const emails = allContacts.filter(c => c.email).map(c => c.email);
    const phones = allContacts.filter(c => c.phone).map(c => c.phone);
    const addresses = allContacts.filter(c => c.notes && c.notes.includes('Found Addresses:'));

    console.log('📧 EMAIL ADDRESSES:');
    [...new Set(emails)].forEach(email => console.log(`   • ${email}`));
    console.log('');

    console.log('📞 PHONE NUMBERS:');
    [...new Set(phones)].forEach(phone => console.log(`   • ${phone}`));
    console.log('');

    if (addresses.length > 0) {
      console.log('🏠 ADDRESSES FOUND:');
      addresses.forEach(contact => {
        const addressPart = contact.notes.split('Found Addresses:')[1];
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
      if (contact.notes && contact.notes.includes('Found Addresses:')) {
        console.log(`   Addresses: ${contact.notes.split('Found Addresses:')[1]}`);
      }
      console.log('');
    });

  } else {
    console.log('❌ No founder contacts found');
    console.log('\n💡 Try these alternatives:');
    console.log('   • Check if the name is spelled correctly');
    console.log('   • Try searching with just the first name');
    console.log('   • Try searching with just the last name');
    console.log('   • Check if they are actually a YC founder');
  }

  console.log('💡 Tips for finding more information:');
  console.log('   • Check Y Combinator\'s official alumni directory');
  console.log('   • Look for their startup\'s website');
  console.log('   • Search LinkedIn profiles');
  console.log('   • Check SEC filings for their company');
  console.log('   • Look for conference speaker information');
  console.log('   • Check their company\'s about page');

  await scraper.close();
  process.exit(0);
}

main(); 