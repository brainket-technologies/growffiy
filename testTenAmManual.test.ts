import { TenAmStrategy } from './src/shared/models/algo/strategies/tenAmStrategy';
import { KiteClient } from './src/shared/services/kite';
import * as clientSelector from './src/shared/models/clientSelector';
import * as marginHelper from './src/shared/utils/marginHelper';
import * as circuitLimitHelper from './src/shared/utils/circuitLimitHelper';
import * as tradeLogger from './src/shared/utils/tradeLogger';
import { getMasterClient } from './src/shared/utils/kiteHelper';

jest.mock('./src/shared/services/kite');
jest.mock('./src/shared/models/clientSelector');
jest.mock('./src/shared/utils/marginHelper');
jest.mock('./src/shared/utils/circuitLimitHelper');
jest.mock('./src/shared/utils/tradeLogger');
jest.mock('./src/shared/utils/kiteHelper');

describe('Manual Ten AM Test', () => {
  it('should run execution flow', async () => {
    // Override console.log to print immediately
    console.log = jest.fn((...args) => process.stdout.write(args.join(' ') + '\n'));
    console.error = jest.fn((...args) => process.stderr.write(args.join(' ') + '\n'));
    
    (getMasterClient as jest.Mock).mockResolvedValue({
      accessToken: 'master_token',
      zerodhaApiKey: 'master_api'
    });

    (clientSelector.fetchClientsByStrategy as jest.Mock).mockResolvedValue([
      {
        strategyName: 'Ten AM Strategy',
        strategyId: 'mock_strategy_id',
        configJson: { basicInfo: { topCount: 5, selectPosition: 1 }, legs: [{ direction: 'buy', name: 'Leg 1' }] },
        assignedClients: [
          {
            id: 'mock_client_1',
            user: { name: 'Test Client' },
            tradingStatus: 'active',
            zerodhaApiKey: 'mock_key',
            accessToken: 'mock_token'
          }
        ]
      }
    ]);

    (marginHelper.calculateClientCapitalAndRisk as jest.Mock).mockResolvedValue({
      success: true,
      clientCapital: 100000,
      capitalAtRisk: 1000
    });

    (circuitLimitHelper.getFreshCircuitLimits as jest.Mock).mockResolvedValue({ lower: 50, upper: 200 });
    (tradeLogger.logFailedTrade as jest.Mock).mockResolvedValue(true);

    let orderCount = 0;
    (KiteClient.placeOrder as jest.Mock).mockImplementation(async (key, token, payload) => {
      orderCount++;
      console.log(`[MOCK KITE] Place Order (${orderCount}): ${payload.transaction_type} ${payload.quantity}x ${payload.tradingsymbol} @ ${payload.price}`);
      return { data: { order_id: 'MOCK_ORDER_' + orderCount } };
    });

    (KiteClient.getOrderById as jest.Mock).mockResolvedValue({ data: [{ status: 'COMPLETE' }] });
    (KiteClient.getHistoricalData as jest.Mock).mockResolvedValue({
      data: {
        candles: [
          ["2026-08-26T09:15:00", 100, 110, 95, 105, 1000],
          ["2026-08-26T09:30:00", 105, 106, 90, 95, 1000],
          ["2026-08-26T09:45:00", 95, 115, 95, 110, 1000]
        ]
      }
    });

    const mockStocks = [
      { symbol: 'RELIANCE', ltp: 100, pChange: 2.5, instrumentToken: '738561' },
      { symbol: 'TCS', ltp: 200, pChange: -1.5, instrumentToken: '2953217' }
    ];

    const strategy = new TenAmStrategy({ marginCache: new Map(), conditionCache: new Map() } as any);
    
    // We mock delay inside strategy? Not possible. Let it run for 30 seconds.
    console.log("Starting dry-run... (Waiting 30s for Target limit order delay)");
    await strategy.executePreOpenTrades('admin1', mockStocks);
    console.log("Dry-run complete!");
  }, 40000); 
});
