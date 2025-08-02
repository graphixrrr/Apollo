import { NextRequest, NextResponse } from 'next/server';
import { scraper } from '@/lib/scraper';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 50 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Create a scraping job record
    const job = await prisma.scrapingJob.create({
      data: {
        query,
        status: 'running',
        startedAt: new Date(),
      },
    });

    try {
      // Perform the scraping
      const result = await scraper.scrapeContacts(query, maxResults);

      // Save found contacts to database
      const savedContacts = [];
      for (const contact of result.contacts) {
        const savedContact = await prisma.contact.create({
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            title: contact.title,
            linkedinUrl: contact.linkedinUrl,
            website: contact.website,
            location: contact.location,
            industry: contact.industry,
            notes: contact.notes,
            tags: contact.tags,
            source: contact.source,
            confidence: contact.confidence,
          },
        });
        savedContacts.push(savedContact);
      }

      // Update job status
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          results: savedContacts.length,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        jobId: job.id,
        contacts: savedContacts,
        totalFound: result.totalFound,
        errors: result.errors,
      });

    } catch (error) {
      // Update job status to failed
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errors: JSON.stringify([error instanceof Error ? error.message : 'Unknown error']),
          completedAt: new Date(),
        },
      });

      throw error;
    }

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Scraping failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job status
      const job = await prisma.scrapingJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ job });
    }

    // Get recent jobs
    const jobs = await prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ jobs });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
} 