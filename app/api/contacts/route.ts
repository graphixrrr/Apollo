import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const company = searchParams.get('company');
    const location = searchParams.get('location');
    const hasEmail = searchParams.get('hasEmail');
    const hasPhone = searchParams.get('hasPhone');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (hasEmail === 'true') {
      where.email = { not: null };
    }

    if (hasPhone === 'true') {
      where.phone = { not: null };
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.contact.count({ where });

    return NextResponse.json({
      contacts,
      total,
      hasMore: offset + limit < total,
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json();

    const contact = await prisma.contact.create({
      data: {
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        title: contactData.title,
        linkedinUrl: contactData.linkedinUrl,
        website: contactData.website,
        location: contactData.location,
        industry: contactData.industry,
        notes: contactData.notes,
        tags: JSON.stringify(contactData.tags || []),
        source: contactData.source || 'manual',
        confidence: contactData.confidence || 1.0,
      },
    });

    return NextResponse.json({ contact });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ contact });

  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
} 