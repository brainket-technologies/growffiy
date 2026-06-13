'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEME_COLORS } from '../lib/constants';

interface AppState {
  clients: any[];
  trades: any[];
  stocks: any[];
  scannerResults: any[];
  isTradingActive: boolean;
  dashboardStats: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    todayTrades: number;
    openTrades: number;
    closedTrades: number;
    totalPnl: number;
    activeSubscriptions: number;
    paymentCollection: number;
  };
  colors: typeof THEME_COLORS;
  loading: boolean;
}

interface AppContextType extends AppState {
  addClient: (data: any) => Promise<any>;
  updateClient: (id: string, data: any) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  toggleTrading: (active: boolean) => Promise<boolean>;
  refreshAllData: () => Promise<void>;
}

const defaultStats = {
  totalClients: 0,
  activeClients: 0,
  inactiveClients: 0,
  todayTrades: 0,
  openTrades: 0,
  closedTrades: 0,
  totalPnl: 0,
  activeSubscriptions: 0,
  paymentCollection: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [isTradingActive, setIsTradingActive] = useState<boolean>(false);
  const [dashboardStats, setDashboardStats] = useState(defaultStats);
  const [loading, setLoading] = useState<boolean>(true);

  // Derive scanner results from live stocks (top losers)
  const scannerResults = [...stocks]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);

  const refreshAllData = useCallback(async () => {
    try {
      const [clientsRes, tradesRes, stocksRes, statsRes] = await Promise.all([
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/trades').then(r => r.json()),
        fetch('/api/stocks').then(r => r.json()),
        fetch('/api/admin/dashboard').then(r => r.json()),
      ]);

      if (clientsRes.success) setClients(clientsRes.clients);
      if (tradesRes.success) setTrades(tradesRes.trades);
      if (stocksRes.success) {
        setStocks(stocksRes.stocks);
        setIsTradingActive(stocksRes.isTradingActive);
      }
      if (statsRes.success) setDashboardStats(statsRes.stats);
    } catch (error) {
      console.error('Error fetching global state:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll fast tick data every 3 seconds for live charts and trades monitoring
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(async () => {
      try {
        const [stocksRes, tradesRes, statsRes] = await Promise.all([
          fetch('/api/stocks').then(r => r.json()),
          fetch('/api/trades').then(r => r.json()),
          fetch('/api/admin/dashboard').then(r => r.json()),
        ]);
        if (stocksRes.success) {
          setStocks(stocksRes.stocks);
          setIsTradingActive(stocksRes.isTradingActive);
        }
        if (tradesRes.success) setTrades(tradesRes.trades);
        if (statsRes.success) setDashboardStats(statsRes.stats);
      } catch (err) {
        console.error('Ticking poll error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshAllData]);

  const addClient = async (clientData: any) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      }).then(r => r.json());

      if (res.success) {
        setClients(prev => [...prev, res.client]);
        await refreshAllData();
        return { success: true, client: res.client, credentials: res.generatedCredentials };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const updateClient = async (id: string, updateData: any) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }).then(r => r.json());

      if (res.success) {
        setClients(prev => prev.map(c => c.id === id ? res.client : c));
        await refreshAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      }).then(r => r.json());

      if (res.success) {
        setClients(prev => prev.filter(c => c.id !== id));
        await refreshAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const toggleTrading = async (active: boolean) => {
    try {
      const res = await fetch('/api/trading/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }).then(r => r.json());

      if (res.success) {
        setIsTradingActive(res.isTradingActive);
        await refreshAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        trades,
        stocks,
        scannerResults,
        isTradingActive,
        dashboardStats,
        colors: THEME_COLORS,
        loading,
        addClient,
        updateClient,
        deleteClient,
        toggleTrading,
        refreshAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppViewModel = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppViewModel must be used within an AppProvider');
  }
  return context;
};
