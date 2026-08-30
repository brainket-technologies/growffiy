import { KiteClient } from '../services/kite';
import { prisma } from '../../database/db';

export interface MarginParams {
  client: any;
  activeAccessToken: string;
  cachedMargin?: number;
  onCacheMargin: (clientId: string, margin: number) => void;
  config: any;
}

export interface MarginResult {
  success: boolean;
  skipReason?: string;
  marginOrApi: number;
  clientCapital: number;
  capitalAtRisk: number;
  riskPercent: number;
  marginRate: number;
}

export async function calculateClientCapitalAndRisk(params: MarginParams): Promise<MarginResult> {
  const { client, activeAccessToken, cachedMargin, onCacheMargin, config } = params;

  const dbCapital = Number(client.capital);
  const dbDisabled = dbCapital === -1;
  let marginOrApi: number;

  if (cachedMargin !== undefined) {
    marginOrApi = cachedMargin;
    console.log(`AlgoEngine: Using cached margin for ${client.user?.name || client.id}: ₹${marginOrApi}`);
  } else {
    try {
      console.log(`AlgoEngine: Fetching live Zerodha margins for client ${client.user?.name || client.id}...`);
      const marginRes = await KiteClient.getMargins(client.zerodhaApiKey!, activeAccessToken);
      if (marginRes && marginRes.status === 'success' && marginRes.data?.equity?.net !== undefined) {
        marginOrApi = Number(marginRes.data.equity.net);
        onCacheMargin(client.id, marginOrApi);
        console.log(`AlgoEngine: Successfully fetched live Net Cash Balance for ${client.user?.name || client.id}: ₹${marginOrApi}`);
      } else {
        marginOrApi = dbDisabled ? 0 : dbCapital;
        console.warn(`AlgoEngine: Margin API response unsuccessful for ${client.user?.name || client.id}. Using DB capital: ₹${marginOrApi}`);
      }
    } catch (marginErr: any) {
      marginOrApi = dbDisabled ? 0 : dbCapital;
      console.error(`AlgoEngine: Error fetching live Zerodha margins for ${client.user?.name || client.id}. Using DB capital: ₹${marginOrApi}`, marginErr);
    }
  }

  // Per Day Trade Amount Validation
  const perDayTradeAmount = client.perDayTradeAmount ? Number(client.perDayTradeAmount) : 0;
  if (perDayTradeAmount > 0) {
    if (marginOrApi < perDayTradeAmount) {
      const errMsg = `Skipped: Insufficient Live Margin (₹${marginOrApi.toLocaleString('en-IN')}) for configured Per Day Trade Amount (₹${perDayTradeAmount.toLocaleString('en-IN')})`;
      return {
        success: false,
        skipReason: errMsg,
        marginOrApi,
        clientCapital: 0,
        capitalAtRisk: 0,
        riskPercent: 0,
        marginRate: 0
      };
    }
  }

  // Count active strategies for this client
  const activeStrategyCount = await prisma.strategyAssignment.count({
    where: {
      clientId: client.id,
      status: 'active',
      strategy: {
        status: 'active'
      }
    }
  });
  const divisor = activeStrategyCount > 0 ? activeStrategyCount : 1;

  // Pick capital: if perDayTradeAmount > 0 use it, else pick lower of margin & dbCapital
  let clientCapital = perDayTradeAmount > 0 ? perDayTradeAmount : (dbDisabled ? marginOrApi : Math.min(marginOrApi, dbCapital));

  // Divide client capital by the count of active assigned strategies
  clientCapital = clientCapital / divisor;
  console.log(`AlgoEngine: Divided client capital for ${client.user?.name || client.id} by ${divisor} active strategies. Per strategy capital = ₹${clientCapital}`);
  
  const configRisk = config?.riskManagement?.riskPerTrade;
  if (perDayTradeAmount <= 0 && (!configRisk || configRisk <= 0)) {
    const errMsg = `riskManagement.riskPerTrade not configured (or invalid) for strategy.`;
    return {
      success: false,
      skipReason: errMsg,
      marginOrApi,
      clientCapital,
      capitalAtRisk: 0,
      riskPercent: 0,
      marginRate: 0
    };
  }

  const riskPercent = configRisk || 0;
  const marginRate = config?.riskManagement?.misMarginRate;

  // If perDayTradeAmount is explicitly configured (> 0), use it directly as capitalAtRisk (INR risk per trade).
  let capitalAtRisk = perDayTradeAmount > 0 ? clientCapital : clientCapital * (riskPercent / 100);

  const capitalAllocPct = config?.riskManagement?.capitalAllocation;
  if (capitalAllocPct !== undefined && capitalAllocPct !== null && capitalAllocPct > 0) {
    const allocLimit = clientCapital * (capitalAllocPct / 100);
    if (capitalAtRisk > allocLimit) {
      capitalAtRisk = allocLimit;
    }
  }

  const dbCapitalLimit = Number(client.capital);
  if (dbCapitalLimit !== -1 && capitalAtRisk > dbCapitalLimit) {
    capitalAtRisk = dbCapitalLimit;
  }

  return {
    success: true,
    marginOrApi,
    clientCapital,
    capitalAtRisk,
    riskPercent,
    marginRate
  };
}
