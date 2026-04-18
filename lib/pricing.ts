export type Tier = 'diy' | 'mls_protected' | 'premium_full_service';

export type PricingSelection = {
  tier: Tier;
  buyerAgencyPercent: number;
  sellerHandlesShowings: boolean;
  showingAgentEnabled: boolean;
  dualAgencyEnabled: boolean;
  extendTerm: boolean;
  addOns: {
    sign: boolean;
    rider: boolean;
    infoBox: boolean;
    drone: boolean;
    photos: boolean;
  };
};

export type PricingPreview = {
  lines: { label: string; value: string }[];
  upfrontNowCents: number;
  currentTermMonths: number;
  quarterlyAdAllocationCents: number;
  renewalQuarterlyAdAllocationCents: number;
  totalPotentialCommissionPercent: number;
  totalAlwaysCreditableCents: number;
  totalPremiumOnlyCreditableCents: number;
  totalNonCreditableCents: number;
  listingAgreementMonths: number;
  sellerControlNotes: string[];
};

const ADD_ONS = {
  sign: 10000,
  rider: 2500,
  infoBox: 2500,
  drone: 25000,
  photos: 50000,
} as const;

export function calculatePricing(selection: PricingSelection): PricingPreview {
  let upfrontNowCents = 0;
  let commissionPercent = 0;
  let alwaysCredit = 0;
  let premiumOnlyCredit = 0;
  let neverCredit = 0;
  const isPremium = selection.tier === 'premium_full_service';
  const listingAgreementMonths = selection.tier === 'diy' ? 0 : 3;
  const quarterlyAdAllocationCents = selection.tier === 'diy' ? 0 : 25000;
  const renewalQuarterlyAdAllocationCents = selection.extendTerm && selection.tier !== 'diy' ? 25000 : 0;
  const lines: { label: string; value: string }[] = [];
  const sellerControlNotes: string[] = [];

  if (selection.tier === 'diy') {
    upfrontNowCents += 39900;
    alwaysCredit += 39900;
    lines.push({ label: 'DIY Boardroom', value: '$399' });
    sellerControlNotes.push('Seller controls the website builder, disclosures, lead flow, showing calendar, and all-in-one marketing tools inside The Boardroom.');
    sellerControlNotes.push('DIY does not include MLS, broker-supported contracts, negotiations, or closing support.');
  }

  if (selection.tier === 'mls_protected') {
    commissionPercent += 2;
    lines.push({ label: 'MLS + Protected Closing', value: '2%' });
    sellerControlNotes.push('This plan uses a 3-month listing agreement. The seller can extend the listing one quarter at a time from the portal.');
    sellerControlNotes.push('Seller controls showing preferences, buyer-agent incentive, ad launch approvals, media approvals, and renewal requests.');
    sellerControlNotes.push('Default setup is seller-managed showings. Broker-protected closing covers disclosures, contracts, and seller support through closing.');

    if (!selection.sellerHandlesShowings || selection.showingAgentEnabled) {
      commissionPercent += 1;
      lines.push({ label: 'Agent-performed showings', value: '+1%' });
      sellerControlNotes.push('Agent showings add a 1% fee and create a dual-agent pathway that should trigger disclosure workflow before offer handling.');
    }
  }

  if (selection.tier === 'premium_full_service') {
    commissionPercent += 3;
    lines.push({ label: 'Premium Full Service', value: '3%' });
    lines.push({ label: 'Premium marketing', value: 'Included' });
    sellerControlNotes.push('This plan uses a 3-month listing agreement and includes premium marketing and open house launch support.');
    sellerControlNotes.push('Seller still controls approvals for listing content, media use, ad launch, open house preferences, buyer-agent incentive, and renewal timing in The Boardroom.');
  }

  if (selection.tier !== 'diy' && selection.buyerAgencyPercent > 0) {
    commissionPercent += selection.buyerAgencyPercent;
    lines.push({ label: 'Buyer agency incentive', value: `${selection.buyerAgencyPercent}%` });
  }

  if (selection.tier === 'premium_full_service' && selection.dualAgencyEnabled) {
    commissionPercent += 1;
    lines.push({ label: 'Dual agency', value: '+1%' });
  }

  if (selection.extendTerm && selection.tier !== 'diy') {
    lines.push({ label: '3-month extension', value: 'Extend one quarter at a time' });
    sellerControlNotes.push('Each extension adds another 3-month term and keeps your Boardroom history intact.');
  }

  // Premium: add-ons are included at $0. Other tiers: add-ons are optional and billed upfront.
  if (isPremium) {
    lines.push({ label: 'For Sale sign + QR', value: 'Included' });
    lines.push({ label: 'Two-sided rider', value: 'Included' });
    lines.push({ label: 'Info box + QR', value: 'Included' });
    lines.push({ label: 'Drone service', value: 'Included' });
    lines.push({ label: 'Professional images', value: 'Included' });
  } else {
    if (selection.addOns.sign) {
      upfrontNowCents += ADD_ONS.sign;
      alwaysCredit += ADD_ONS.sign;
      lines.push({ label: 'For Sale sign + QR', value: '$100' });
    }
    if (selection.addOns.rider) {
      upfrontNowCents += ADD_ONS.rider;
      alwaysCredit += ADD_ONS.rider;
      lines.push({ label: 'Two-sided rider', value: '$25' });
    }
    if (selection.addOns.infoBox) {
      upfrontNowCents += ADD_ONS.infoBox;
      alwaysCredit += ADD_ONS.infoBox;
      lines.push({ label: 'Info box + QR', value: '$25' });
    }
    if (selection.addOns.drone) {
      upfrontNowCents += ADD_ONS.drone;
      premiumOnlyCredit += ADD_ONS.drone;
      lines.push({ label: 'Drone service', value: '$250' });
    }
    if (selection.addOns.photos) {
      upfrontNowCents += ADD_ONS.photos;
      premiumOnlyCredit += ADD_ONS.photos;
      lines.push({ label: 'Professional images', value: '$500' });
    }
  }

  // Keep ad allocations in the totals, but don't emphasize them in the line-item summary.
  if (quarterlyAdAllocationCents > 0) neverCredit += quarterlyAdAllocationCents;
  if (renewalQuarterlyAdAllocationCents > 0) neverCredit += renewalQuarterlyAdAllocationCents;

  return {
    lines,
    upfrontNowCents,
    currentTermMonths: 3,
    quarterlyAdAllocationCents,
    renewalQuarterlyAdAllocationCents,
    totalPotentialCommissionPercent: commissionPercent,
    totalAlwaysCreditableCents: alwaysCredit,
    totalPremiumOnlyCreditableCents: premiumOnlyCredit,
    totalNonCreditableCents: neverCredit,
    listingAgreementMonths,
    sellerControlNotes,
  };
}
