'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ContactList } from '@/components/ContactList';
import { ScrapingStatus } from '@/components/ScrapingStatus';
import { Header } from '@/components/Header';
import { Contact } from '@/lib/types';

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapingJob, setScrapingJob] = useState<any>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsScraping(true);
    setContacts([]);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults: 50 }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
        setScrapingJob({ id: data.jobId, status: 'completed' });
      } else {
        console.error('Scraping failed:', data.error);
      }
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Anyone's Contact Information
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered web scraping to discover phone numbers, emails, and more
          </p>
          
          <SearchBar onSearch={handleSearch} disabled={isScraping} />
        </div>

        {/* Scraping Status */}
        {isScraping && (
          <ScrapingStatus jobId={scrapingJob?.id} />
        )}

        {/* Results */}
        {contacts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Found {contacts.length} contacts
              </h2>
              <button
                onClick={() => setContacts([])}
                className="btn-secondary"
              >
                Clear Results
              </button>
            </div>
            <ContactList contacts={contacts} />
          </div>
        )}

        {/* Features Section */}
        {!isScraping && contacts.length === 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="w-12 h-12 bg-apollo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-apollo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Search</h3>
                <p className="text-gray-600">
                  Enter a name, company, or title and our AI will search across the web
                </p>
              </div>
              
              <div className="card text-center">
                <div className="w-12 h-12 bg-apollo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-apollo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Extract Contacts</h3>
                <p className="text-gray-600">
                  Automatically extract phone numbers, emails, and contact details
                </p>
              </div>
              
              <div className="card text-center">
                <div className="w-12 h-12 bg-apollo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-apollo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Results</h3>
                <p className="text-gray-600">
                  Save, organize, and export your discovered contacts
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 