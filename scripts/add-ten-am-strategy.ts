import { prisma } from '../src/database/db';

async function main() {
  const configJson = {
    "legs": [
      {
        "name": "Leg 1 (Gainers)",
        "enabled": true,
        "entryTime": "10:00:00",
        "timeframe": "15m",
        "tradeAction": {
          "action": "Long",
          "orderType": "SL-Market",
          "bufferPercent": 0.1,
          "candlePriceType": "high"
        }
      },
      {
        "name": "Leg 2 (Losers)",
        "enabled": true,
        "entryTime": "10:00:00",
        "timeframe": "15m",
        "tradeAction": {
          "action": "Short",
          "orderType": "SL-Market",
          "bufferPercent": 0.1,
          "candlePriceType": "low"
        }
      }
    ],
    "target": {
      "type": "Fixed Points",
      "partialExit": 100,
      "profitPercent": 2,
      "trailingTarget": -1,
      "riskRewardRatio": 2
    },
    "stoploss": {
      "type": "Fixed %",
      "orderType": "Market",
      "trailingSL": -1,
      "fixedPoints": 10,
      "riskPercent": 1,
      "fixedPercent": 1
    },
    "basicInfo": {
      "name": "Ten AM Strategy",
      "status": "active",
      "segment": "NSE F&O",
      "exchange": "NSE",
      "exitTime": "15:15:00",
      "tradeType": "Intraday",
      "description": "10:00 AM GRG/RGR pattern breakout strategy",
      "preSelectTime": "09:30:00",
      "selectPosition": 1,
      "checkIntervalSec": 60,
      "stockSelectionType": "Gapup (Gainers)"
    },
    "conditions": [],
    "riskManagement": {
      "killSwitch": false,
      "maxDailyLoss": -1,
      "riskPerTrade": 2,
      "misMarginRate": -1,
      "maxDailyProfit": -1,
      "maxOpenPositions": 2,
      "capitalAllocation": -1
    }
  };

  await prisma.strategy.create({
    data: {
      name: "Ten AM Strategy",
      description: "10:00 AM GRG/RGR breakout strategy",
      status: "active",
      configJson: JSON.stringify(configJson)
    }
  });
  console.log("Ten AM Strategy successfully added to database.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
