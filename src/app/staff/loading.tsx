'use client';

import React from 'react';
import { Loader } from '../../shared/components/views/Loader';

export default function AdminLoading() {
  return <Loader title="Loading Page..." text="Please wait while the development server compiles the page (20-30s)..." fullscreen={false} />;
}
