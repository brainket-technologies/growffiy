import { TenAmStrategy } from '../src/shared/models/algo/strategies/tenAmStrategy';
import { KiteClient } from '../src/shared/services/kite';
import * as clientSelector from '../src/shared/models/algo/clientSelector';
import * as marginHelper from '../src/shared/utils/marginHelper';
import * as circuitLimitHelper from '../src/shared/utils/circuitLimitHelper';
import * as tradeLogger from '../src/shared/utils/tradeLogger';
import * as kiteHelper from '../src/shared/utils/kiteHelper';
import { prisma } from '../src/database/db';

async function run() {
  console.log("=========================================");
  console.log("🚀 STARTING TEN AM STRATEGY MANUAL TEST 🚀");
  console.log("=========================================\n");

  console.log("🛠️ Mocking Database and API connections...");

  // Mock Master Client
  kiteHelper.getMasterClient = async () => ({
    accessToken: 'master_token_123',
    zerodhaApiKey: 'master_api_123'
  }) as any;

  // Mock Prisma
  (prisma.marketWatchSnapshot as any).findUnique = async () => ({
    data: [
      { symbol: 'RELIANCE', ltp: 100, pChange: 2.5, instrumentToken: '738561' },
      { symbol: 'TCS', ltp: 200, pChange: -1.5, instrumentToken: '2953217' }
    ]
  });

  // Mock Clients from DB
  clientSelector.fetchClientsByStrategy = async () => [
    {
      strategyName: 'Ten AM Strategy',
      strategyId: 'str_123',
      configJson: { basicInfo: { topCount: 5, selectPosition: 1 }, legs: [{ direction: 'buy', name: 'Leg 1' }] },
      assignedClients: [
        {
          id: 'client_1',
          user: { name: 'Rahul Demo' },
          tradingStatus: 'active',
          zerodhaApiKey: 'api_key_rahul',
          accessToken: 'token_rahul'
        }
      ]
    }
  ] as any;

  // Mock Margin Check
  marginHelper.calculateClientCapitalAndRisk = async () => ({
    success: true,
    clientCapital: 50000,
    capitalAtRisk: 2500
  }) as any;

  // Mock Circuit Limits
  circuitLimitHelper.getFreshCircuitLimits = async () => ({ lower: 90, upper: 120 }) as any;
  tradeLogger.logFailedTrade = async () => true as any;

  // Mock KiteClient API methods
  let orderCount = 0;
  KiteClient.placeOrder = async (key, token, payload) => {
    orderCount++;
    console.log(`\n✅ [KITE API MOCK] 🛒 Order Placed!`);
    console.log(`   - Client: ${key}`);
    console.log(`   - Type: ${payload.transaction_type} ${payload.order_type}`);
    console.log(`   - Stock: ${payload.tradingsymbol}`);
    console.log(`   - Qty: ${payload.quantity}`);
    console.log(`   - Price: ${payload.price} (Trigger: ${payload.trigger_price || 'N/A'})`);
    return { data: { order_id: 'ORD_MOCK_' + orderCount } } as any;
  };

  KiteClient.getOrderById = async () => {
    console.log(`   ⏳ [KITE API MOCK] Polling Order Status... -> 'COMPLETE'`);
    return { data: [{ status: 'COMPLETE' }] } as any;
  };

  KiteClient.getHistoricalData = async (key, token, symbol) => {
    console.log(`📊 [KITE API MOCK] Fetching Candles for ${symbol}... (Returning GRG Pattern)`);
    return {
      data: {
        candles: [
          ["2026-08-26T09:15:00", 100, 110, 95, 105, 1000], // Green
          ["2026-08-26T09:30:00", 105, 106, 90, 95, 1000],  // Red
          ["2026-08-26T09:45:00", 95, 115, 95, 110, 1000]   // Green
        ]
      }
    } as any;
  };

  const mockStocks = [
    { symbol: 'RELIANCE', ltp: 100, pChange: 2.5, instrumentToken: '738561' },
    { symbol: 'TCS', ltp: 200, pChange: -1.5, instrumentToken: '2953217' }
  ];

  console.log("\n▶️ Executing 'executePreOpenTrades'...");
  const strategy = new TenAmStrategy({ marginCache: new Map(), conditionCache: new Map() } as any);
  
  // NOTE: For the manual test, we override the global setTimeout if possible or just let it run 30s.
  // Letting it run 30s is perfectly fine to prove it works.
  console.log("⏱️ Note: The script will pause for 30 seconds after SL order (waiting for Target Limit order)...");
  
  await strategy.executePreOpenTrades('admin_test', mockStocks);
  
  console.log("\n=========================================");
  console.log("🎉 TEST COMPLETE!");
  console.log("=========================================\n");
}

run().catch(console.error);
