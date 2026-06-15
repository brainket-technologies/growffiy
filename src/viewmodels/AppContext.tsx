'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { THEME_COLORS, API_ENDPOINTS } from '../lib/constants';
import { api } from '../lib/api';

interface AppState {
  activeUser: any;
  clients: any[];
  trades: any[];
  stocks: any[];
  preOpenStocks: any[];
  preOpenDate: string;
  scannerResults: any[];
  isTradingActive: boolean;
  isSyncing: boolean;
  isWsConnected: boolean;
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
  logToAuditLogs: (action: string, details: string, type?: string) => Promise<void>;
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
  const [activeUser, setActiveUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [preOpenStocks, setPreOpenStocks] = useState<any[]>([]);
  const [preOpenDate, setPreOpenDate] = useState<string>('');
  const [isTradingActive, setIsTradingActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [dashboardStats, setDashboardStats] = useState(defaultStats);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedName = localStorage.getItem('growffiy_logged_in_user_name');
      if (storedId) {
        const cleanName = storedName || storedId
          .split(/[_-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Set initial local state from localStorage to avoid loading state delay
        setActiveUser({ name: cleanName, id: storedId });

        // Fetch complete profile from API including active subscriptions
        api.get(`${API_ENDPOINTS.AUTH_PROFILE}?userId=${storedId}`)
          .then(res => {
            if (res.success && res.user) {
              setActiveUser(res.user);
            }
          })
          .catch(err => console.error('Error loading active user profile:', err));
      }
    }
  }, []);

  // Derive scanner results from static pre-open stocks (top losers)
  const scannerResults = [...preOpenStocks]
    .sort((a, b) => a.changePercent - b.changePercent);

  const refreshAllData = useCallback(async () => {
    try {
      const [clientsRes, tradesRes, stocksRes, statsRes] = await Promise.all([
        api.get(API_ENDPOINTS.CLIENTS),
        api.get(API_ENDPOINTS.TRADES),
        api.get(API_ENDPOINTS.STOCKS),
        api.get(API_ENDPOINTS.DASHBOARD),
      ]);

      if (clientsRes.success) setClients(clientsRes.clients);
      if (tradesRes.success) setTrades(tradesRes.trades);
      if (stocksRes.success) {
        setStocks(stocksRes.stocks);
        if (stocksRes.preOpenStocks) {
          setPreOpenStocks(stocksRes.preOpenStocks);
        }
        if (stocksRes.preOpenDate) {
          setPreOpenDate(stocksRes.preOpenDate);
        }
        setIsTradingActive(stocksRes.isTradingActive);
        setIsWsConnected(stocksRes.isWsConnected || false);
      }
      if (statsRes.success) setDashboardStats(statsRes.stats);
    } catch (error) {
      console.error('Error fetching global state:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll fast tick data every 3 seconds for live charts and trades monitoring
  // Simulate high-frequency WebSocket tick data locally in the browser (every 400ms)
  // Poll database updates (stocks, trades & dashboard stats) every 2 seconds
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(async () => {
      try {
        setIsSyncing(true);
        const [tradesRes, statsRes, stocksRes] = await Promise.all([
          api.get(API_ENDPOINTS.TRADES),
          api.get(API_ENDPOINTS.DASHBOARD),
          api.get(API_ENDPOINTS.STOCKS),
        ]);
        if (tradesRes.success) setTrades(tradesRes.trades);
        if (statsRes.success) setDashboardStats(statsRes.stats);
        if (stocksRes.success) {
          setStocks(stocksRes.stocks);
          if (stocksRes.preOpenStocks) {
            setPreOpenStocks(stocksRes.preOpenStocks);
          }
          if (stocksRes.preOpenDate) {
            setPreOpenDate(stocksRes.preOpenDate);
          }
          setIsTradingActive(stocksRes.isTradingActive);
          setIsWsConnected(stocksRes.isWsConnected || false);
        }
      } catch (err: any) {
        console.error('Ticking poll error:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshAllData]);

  const logToAuditLogs = async (action: string, details: string, type: string = 'action') => {
    try {
      const payload = { action, user: 'Firoz Mohammad', details, type };
      await api.post(API_ENDPOINTS.AUDIT_LOGS, payload);
      
      if (typeof window !== 'undefined') {
        const timeStr = new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const localLogs = JSON.parse(localStorage.getItem('growffiy_audit_logs') || '[]');
        localLogs.unshift({ ...payload, time: timeStr });
        localStorage.setItem('growffiy_audit_logs', JSON.stringify(localLogs.slice(0, 50)));
      }
    } catch (err) {
      console.error('Audit log registration failed:', err);
    }
  };

  const addClient = async (clientData: any) => {
    try {
      const res = await api.post(API_ENDPOINTS.CLIENTS, clientData);

      if (res.success) {
        setClients(prev => [...prev, res.client]);
        await logToAuditLogs(
          'Client Added',
          `Created client profile for ${clientData.name} (Capital: ₹${Number(clientData.capital).toLocaleString()}) | Endpoint: POST ${API_ENDPOINTS.CLIENTS} | Payload: ${JSON.stringify(clientData)} | Response: ${JSON.stringify(res.client)}`,
          'action'
        );
        await refreshAllData();
        return { success: true, client: res.client, credentials: res.generatedCredentials };
      }
      
      await logToAuditLogs(
        'Client Add Failed',
        `Failed to add client profile for ${clientData.name || 'Unknown'}: Server returned failure | Endpoint: POST ${API_ENDPOINTS.CLIENTS} | Payload: ${JSON.stringify(clientData)}`,
        'security'
      );
      return { success: false };
    } catch (err: any) {
      await logToAuditLogs(
        'Client Add Error',
        `Network error when adding client profile: ${err.message || 'Unknown error'} | Endpoint: POST ${API_ENDPOINTS.CLIENTS} | Payload: ${JSON.stringify(clientData)}`,
        'security'
      );
      return { success: false };
    }
  };

  const updateClient = async (id: string, updateData: any) => {
    let clientName = 'Client';
    try {
      const existingClient = clients.find(c => c.id === id);
      clientName = existingClient?.user?.name || existingClient?.name || 'Client';

      const res = await api.put(`${API_ENDPOINTS.CLIENTS}/${id}`, updateData);

      if (res.success) {
        setClients(prev => prev.map(c => c.id === id ? res.client : c));

        let action = 'Client Updated';
        let details = `Updated configuration for client ${clientName}`;
        let type = 'action';

        if (updateData.tradingStatus !== undefined) {
          action = 'Trading Status Changed';
          details = `Trading status of client ${clientName} changed to ${updateData.tradingStatus.toUpperCase()} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)} | Response: ${JSON.stringify(res.client)}`;
          await logToAuditLogs(action, details, type);

          if (updateData.tradingStatus === 'inactive') {
            await logToAuditLogs(
              'Kite Token Disconnected',
              `Disconnected active Kite session token for ${clientName} due to Inactive Trading Status | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: {"accessToken": null} | Response: ${JSON.stringify(res.client)}`,
              'security'
            );
          }
        } else if (updateData.accessToken !== undefined) {
          action = updateData.accessToken ? 'Kite Token Refreshed' : 'Kite Token Disconnected';
          details = updateData.accessToken 
            ? `Successfully refreshed Kite session token for ${clientName} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)} | Response: ${JSON.stringify(res.client)}` 
            : `Disconnected active Kite session token for ${clientName} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)} | Response: ${JSON.stringify(res.client)}`;
          type = updateData.accessToken ? 'system' : 'security';
          await logToAuditLogs(action, details, type);
        } else {
          details = `${details} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)} | Response: ${JSON.stringify(res.client)}`;
          await logToAuditLogs(action, details, type);
        }

        await refreshAllData();
        return true;
      }
      
      await logToAuditLogs(
        'Client Update Failed',
        `Failed to update client configuration for ${clientName} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)}`,
        'security'
      );
      return false;
    } catch (err: any) {
      await logToAuditLogs(
        'Client Update Error',
        `Network error when updating client ${clientName}: ${err.message || 'Unknown error'} | Endpoint: PUT ${API_ENDPOINTS.CLIENTS}/${id} | Payload: ${JSON.stringify(updateData)}`,
        'security'
      );
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    let clientName = 'Client';
    try {
      const existingClient = clients.find(c => c.id === id);
      clientName = existingClient?.user?.name || existingClient?.name || 'Client';

      const res = await api.delete(`${API_ENDPOINTS.CLIENTS}/${id}`);

      if (res.success) {
        setClients(prev => prev.filter(c => c.id !== id));
        await logToAuditLogs(
          'Client Deleted',
          `Removed client profile for ${clientName} | Endpoint: DELETE ${API_ENDPOINTS.CLIENTS}/${id} | Payload: {} | Response: ${JSON.stringify(res)}`,
          'security'
        );
        await refreshAllData();
        return true;
      }
      
      await logToAuditLogs(
        'Client Delete Failed',
        `Failed to delete client profile for ${clientName} | Endpoint: DELETE ${API_ENDPOINTS.CLIENTS}/${id}`,
        'security'
      );
      return false;
    } catch (err: any) {
      await logToAuditLogs(
        'Client Delete Error',
        `Network error when deleting client ${clientName}: ${err.message || 'Unknown error'} | Endpoint: DELETE ${API_ENDPOINTS.CLIENTS}/${id}`,
        'security'
      );
      return false;
    }
  };

  const toggleTrading = async (active: boolean) => {
    try {
      const res = await api.post(API_ENDPOINTS.TOGGLE_TRADING, { active });

      if (res.success) {
        setIsTradingActive(res.isTradingActive);
        await logToAuditLogs(
          active ? 'Auto Trading Started' : 'Auto Trading Stopped',
          `${active ? 'Algorithmic terminal engine powered on' : 'Algorithmic terminal engine powered off'} | Endpoint: POST ${API_ENDPOINTS.TOGGLE_TRADING} | Payload: ${JSON.stringify({ active })} | Response: ${JSON.stringify(res)}`,
          'info'
        );
        await refreshAllData();
        return true;
      }
      
      await logToAuditLogs(
        'Auto Trading Toggle Failed',
        `Failed to toggle algorithmic engine to ${active ? 'ON' : 'OFF'}`,
        'system'
      );
      return false;
    } catch (err: any) {
      await logToAuditLogs(
        'Auto Trading Toggle Error',
        `Network error when toggling algorithmic engine: ${err.message || 'Unknown error'}`,
        'system'
      );
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeUser,
        clients,
        trades,
        stocks,
        preOpenStocks,
        preOpenDate,
        scannerResults,
        isTradingActive,
        isSyncing,
        isWsConnected,
        dashboardStats,
        colors: THEME_COLORS,
        loading,
        addClient,
        updateClient,
        deleteClient,
        toggleTrading,
        refreshAllData,
        logToAuditLogs,
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
