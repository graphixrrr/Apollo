#!/usr/bin/env tsx

import { scraper } from '../lib/scraper';

async function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const company = args[1];

  if (!name) {
    console.log('🎯 Real Contact Finder');
    console.log('======================\n');
    console.log('Usage: pnpm find-real-contacts "Name" [Company]');
    console.log('Example: pnpm find-real-contacts "John Smith"');
    console.log('Example: pnpm find-real-contacts "John Smith" "Y Combinator"');
    console.log('\nThis will search for:');
    console.log('• Real phone numbers from directories');
    console.log('• Email addresses using Hunter.io');
    console.log('• LinkedIn profiles and company domains');
    console.log('• SEC filings for public companies');
    console.log('• Conference speaker information');
    console.log('• Public records and directories');
    process.exit(1);
  }

  console.log(`🎯 Finding Real Contact Info for: "${name}"${company ? ` at ${company}` : ''}`);
  console.log('========================================================\n');

  try {
    const contacts = await scraper.findContactInfo(name, company);

    if (contacts.length > 0) {
      console.log(`✅ Found ${contacts.length} contact results:\n`);
      
      contacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.firstName} ${contact.lastName}`);
        if (contact.company) console.log(`   Company: ${contact.company}`);
        if (contact.email) console.log(`   Email: ${contact.email}`);
        if (contact.phone) console.log(`   Phone: ${contact.phone}`);
        console.log(`   Confidence: ${Math.round(contact.confidence * 100)}%`);
        console.log(`   Source: ${contact.source}`);
        console.log('');
      });

      // Summary
      console.log('📊 SUMMARY:');
      console.log('===========\n');
      
      const emails = contacts.filter(c => c.email).map(c => c.email);
      const phones = contacts.filter(c => c.phone).map(c => c.phone);
      
      if (emails.length > 0) {
        console.log('📧 EMAIL ADDRESSES:');
        [...new Set(emails)].forEach(email => console.log(`   • ${email}`));
        console.log('');
      }
      
      if (phones.length > 0) {
        console.log('📞 PHONE NUMBERS:');
        [...new Set(phones)].forEach(phone => console.log(`   • ${phone}`));
        console.log('');
      }

      // Highest confidence results
      const highConfidence = contacts
        .filter(c => c.confidence > 0.7)
        .sort((a, b) => b.confidence - a.confidence);

      if (highConfidence.length > 0) {
        console.log('🎯 HIGHEST CONFIDENCE RESULTS:');
        highConfidence.slice(0, 3).forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.firstName} ${contact.lastName} (${Math.round(contact.confidence * 100)}%)`);
          if (contact.email) console.log(`   Email: ${contact.email}`);
          if (contact.phone) console.log(`   Phone: ${contact.phone}`);
          console.log(`   Source: ${contact.source}`);
          console.log('');
        });
      }

    } else {
      console.log('❌ No contact information found');
      console.log('\n💡 Try these alternatives:');
      console.log('   • Check if the name is spelled correctly');
      console.log('   • Try searching with just the first name');
      console.log('   • Try searching with just the last name');
      console.log('   • Add a company name for better results');
      console.log('   • Check if they have a public profile');
    }

    console.log('💡 Tips for better results:');
    console.log('   • Add company name for more accurate results');
    console.log('   • Use full name when possible');
    console.log('   • Check LinkedIn profiles manually');
    console.log('   • Look for company websites');
    console.log('   • Search for conference speaker information');

  } catch (error) {
    console.error('❌ Error finding contacts:', error);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

main(); 