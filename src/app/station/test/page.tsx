import React from 'react';
import PodDiagnosticClient from './PodDiagnosticClient';

export const metadata = {
  title: 'Station Pod Hardware Diagnostics — Udhyana Games',
  description: 'Interactive Hardware Calibration & Testing Suite for NEC VersaPro Tablets'
};

export default function PodTestPage() {
  return <PodDiagnosticClient />;
}
