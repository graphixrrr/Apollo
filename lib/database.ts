import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function seedDatabase() {
  // Seed some initial scraping sources
  const sources = [
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      isActive: true,
    },
    {
      name: 'Company Websites',
      url: 'https://example.com',
      isActive: true,
    },
    {
      name: 'Business Directories',
      url: 'https://example.com',
      isActive: true,
    },
  ];

  for (const source of sources) {
    await prisma.scrapingSource.upsert({
      where: { name: source.name },
      update: source,
      create: source,
    });
  }

  console.log('Database seeded successfully');
} 