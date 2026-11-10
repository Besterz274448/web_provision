import React from 'react';
import { Heading } from '../ui/heading';

export default function PageContainer({
  children,
  pageTitle,
  pageDescription,
  pageHeaderAction
}: {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  pageHeaderAction?: React.ReactNode;
}) {
  return (
    <div className='flex flex-1 flex-col p-4 md:px-6'>
      {pageTitle && (
        <div className='mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3'>
          <Heading title={pageTitle} description={pageDescription ?? ''} />
          {pageHeaderAction}
        </div>
      )}
      {children}
    </div>
  );
}
