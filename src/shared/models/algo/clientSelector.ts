import { prisma } from '../../../database/db';

export interface SelectedClient {
  id: string;
  accessToken: string | null;
  zerodhaApiKey: string | null;
  zerodhaApiSecret: string | null;
  zerodhaPassword: string | null;
  zerodhaTotpSecret: string | null;
  zerodhaClientId: string | null;
  zerodhaSession: string | null;
  capital: any;
  perDayTradeAmount: any;
  productTypeId: string | null;
  proxyUrl: string | null;
  dedicatedIp: string | null;
  strategyId: string;
  strategy: any;
  user: { name: string; id: string; email: string };
  [key: string]: any;
}

/**
 * Fetch all eligible clients for algo trading.
 *
 * 6 CONDITIONS that must all be satisfied:
 *  1. Assignment status          = 'active'
 *  2. Client tradingStatus       = 'active'
 *  3. Client subscriptionStatus  = 'active'
 *  4. Client kycStatus           = 'verified'
 *  5. Client productType         = 'Algo'
 *  6. Strategy status            = 'active'
 *
 * @param strategyId - optional: filter to a specific strategy
 * @param requireAccessToken - if true, only clients with non-null accessToken are returned (used for preSelect)
 */
export async function fetchEligibleClients(
  strategyId?: string,
  requireAccessToken = false
): Promise<SelectedClient[]> {
  // Resolve Algo product type ID
  const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
  if (!algoType) {
    console.log('ClientSelector: Algo product type not found. No clients selected.');
    return [];
  }

  const assignments = await prisma.strategyAssignment.findMany({
    where: {
      // CONDITION 1: Assignment must be active
      status: 'active',
      client: {
        // CONDITION 2: Client trading must be active
        tradingStatus: 'active',
        // CONDITION 3: Client subscription must be active
        subscriptionStatus: 'active',
        // CONDITION 4: Client KYC must be verified
        kycStatus: 'verified',
        // CONDITION 5: Client must have Algo product type
        productTypeId: algoType.id,
        // Optional: Only clients with a live Kite session (for preSelect)
        ...(requireAccessToken ? { accessToken: { not: null } } : {})
      },
      // CONDITION 6: Strategy must be active (optionally filter by specific strategy ID)
      strategy: strategyId
        ? { id: strategyId, status: 'active' }
        : { status: 'active' }
    },
    include: {
      client: {
        include: { user: true }
      },
      strategy: true
    }
  });

  return assignments.map((a: any) => ({
    ...a.client,
    strategyId: a.strategyId,
    strategy: a.strategy
  })) as SelectedClient[];
}
