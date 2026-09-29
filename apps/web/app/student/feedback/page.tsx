'use client';

import React from 'react';
import { SupportFeedbackView } from '@/components/student/SupportFeedbackView';

export default function StudentFeedbackPage() {
  return (
    <div>
      <SupportFeedbackView isEmbedded={true} />
    </div>
  );
}
