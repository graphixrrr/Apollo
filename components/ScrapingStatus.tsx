'use client';

import { useEffect, useState } from 'react';

interface ScrapingStatusProps {
  jobId?: string;
}

export function ScrapingStatus({ jobId }: ScrapingStatusProps) {
  const [status, setStatus] = useState('Searching the web...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scrape?jobId=${jobId}`);
        const data = await response.json();

        if (data.job) {
          if (data.job.status === 'completed') {
            setStatus('Search completed!');
            setProgress(100);
            clearInterval(interval);
          } else if (data.job.status === 'failed') {
            setStatus('Search failed');
            setProgress(100);
            clearInterval(interval);
          } else {
            setProgress(Math.min(progress + 10, 90));
          }
        }
      } catch (error) {
        console.error('Error checking job status:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, progress]);

  return (
    <div className="card max-w-md mx-auto">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-apollo-600"></div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{status}</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-apollo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 