'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Activity, ArrowLeft, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import Footer from '../../../shared/components/views/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div style={{ backgroundColor: '#030712', color: '#f3f4f6', fontFamily: 'var(--font-family)' }}>
      <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="Growffiy" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>GROWFFIY</span>
            </div>
            <Link href="/">
              <Button variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '20px', padding: '6px 16px' }}>
                <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
              </Button>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
            {/* Info Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>Get in Touch</h1>
                <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>Have queries about strategies, API configurations, or custom allocations? Reach out to our support desk.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>Support Email</p>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>support@growffiy.com</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>Support Hotline</p>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>+91 98765 43210</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9ca3af' }}>Corporate Office</p>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>Financial District, Hyderabad, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.06)', padding: '32px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <CheckCircle2 size={36} color="var(--color-success)" />
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Message Received!</h3>
                  <p style={{ color: '#9ca3af', fontSize: '13px' }}>Thank you. Our technical desk will evaluate and reply within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>Message Details</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <Button type="submit" style={{ width: '100%', marginTop: '8px' }}>
                    Send Support Message
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

