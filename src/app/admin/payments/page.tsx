'use client';

import React from 'react';
import { Card } from '../../../views/components/Card';
import { CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function PaymentsPage() {
  const transactionsList = [
    { id: 'TXN-908234', client: 'Firoz Mohammad', plan: 'Hedge Fund Algo', amount: '₹14,999', date: '13 June 2026', type: 'Credit', status: 'Success' },
    { id: 'TXN-908231', client: 'Aditya Birla', plan: 'Pre-Open Breakout', amount: '₹4,999', date: '12 June 2026', type: 'Credit', status: 'Success' },
    { id: 'TXN-908219', client: 'Sumit Joshi', plan: 'Momentum Scalper', amount: '₹9,999', date: '10 June 2026', type: 'Credit', status: 'Success' },
    { id: 'TXN-908204', client: 'System Broker', plan: 'Zerodha Wallet Refill', amount: '₹2,500', date: '08 June 2026', type: 'Debit', status: 'Success' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Billing & Transactions Log
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>View client subscriptions, gateway payments, and automated wallet balance changes.</p>
      </div>

      {/* Grid Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Monthly Revenue</p>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>₹29,997</h3>
            </div>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CreditCard size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Transaction Records
        </h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Client</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionsList.map((txn, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{txn.id}</td>
                  <td>{txn.client}</td>
                  <td>{txn.plan}</td>
                  <td style={{ fontWeight: 600 }}>{txn.amount}</td>
                  <td>{txn.date}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: txn.type === 'Credit' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {txn.type === 'Credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {txn.type}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">{txn.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
