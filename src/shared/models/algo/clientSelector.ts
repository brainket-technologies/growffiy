import { prisma } from '@/database/db';

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

// ---------------------------------------------------------------------------

/**
 * Per-strategy grouped result — strategy status + assigned clients list.
 */
export interface StrategyClientGroup {
  strategyId: string;
  strategyName: string;
  strategyStatus: string;          // 'active' | 'inactive' | etc.
  configJson: any;
  assignedClients: SelectedClient[]; // clients passing all 6 conditions
}

/**
 * Fetch ALL active strategies and, for each strategy, the list of
 * clients that are assigned to it (passing all 6 eligibility conditions).
 *
 * Returns one entry per strategy — even if it has zero eligible clients.
 *
 * 6 CONDITIONS applied to each client:
 *  1. Assignment status          = 'active'
 *  2. Client tradingStatus       = 'active'
 *  3. Client subscriptionStatus  = 'active'
 *  4. Client kycStatus           = 'verified'
 *  5. Client productType         = 'Algo'
 *  6. Strategy status            = 'active'
 *
 * @param requireAccessToken - if true, clients without accessToken are excluded
 */
export async function fetchClientsByStrategy(
  requireAccessToken = false
): Promise<StrategyClientGroup[]> {
  // Resolve Algo product type ID
  const algoType = await prisma.productType.findUnique({ where: { name: 'Algo' } });
  if (!algoType) {
    console.log('ClientSelector: Algo product type not found.');
    return [];
  }

  // Fetch all ACTIVE strategies
  const strategies = await prisma.strategy.findMany({
    where: { status: 'active' }
  });

  if (strategies.length === 0) {
    console.log('ClientSelector: No active strategies found.');
    return [];
  }

  // Fetch all eligible assignments in one DB call
  const assignments = await prisma.strategyAssignment.findMany({
    where: {
      // CONDITION 1: Assignment active
      status: 'active',
      strategy: { status: 'active' },  // CONDITION 6
      client: {
        tradingStatus: 'active',        // CONDITION 2
        subscriptionStatus: 'active',   // CONDITION 3
        kycStatus: 'verified',          // CONDITION 4
        productTypeId: algoType.id,     // CONDITION 5
        ...(requireAccessToken ? { accessToken: { not: null } } : {})
      }
    },
    include: {
      client: { include: { user: true } },
      strategy: true
    }
  });

  // Group assignments by strategyId
  const groupMap = new Map<string, SelectedClient[]>();
  for (const a of assignments) {
    if (!groupMap.has(a.strategyId)) groupMap.set(a.strategyId, []);
    groupMap.get(a.strategyId)!.push({
      ...(a.client as any),
      strategyId: a.strategyId,
      strategy: a.strategy
    } as SelectedClient);
  }

  // Build final result — one entry per active strategy
  return strategies.map((s: any) => ({
    strategyId: s.id,
    strategyName: s.name,
    strategyStatus: s.status,
    configJson: s.configJson ? (() => { try { return JSON.parse(s.configJson as string); } catch { return null; } })() : null,
    assignedClients: groupMap.get(s.id) ?? []
  }));
}
