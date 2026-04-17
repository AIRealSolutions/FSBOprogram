import { NextRequest, NextResponse } from 'next/server';
import { calculatePricing, type PricingSelection } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PricingSelection;
  return NextResponse.json(calculatePricing(body));
}
