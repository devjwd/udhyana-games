import React from 'react';
import StationMonitorClient from '../StationMonitorClient';

export const metadata = {
  title: 'Station Monitor — Udhyana Games',
  description: 'Live Station Countdown & Gaming Pod Monitor'
};

export default async function StationIdPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const stationId = decodeURIComponent(resolvedParams.id);

  return <StationMonitorClient initialStationId={stationId} />;
}
