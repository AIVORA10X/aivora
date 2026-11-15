'use client';

import { useState } from 'react';

export function PayButton({ orderId, amount }: { orderId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در شروع پرداخت');
        setLoading(false);
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError('خطای شبکه');
      setLoading(false);
    }
  }

  if (!amount || amount < 1000) return null;

  return (
    <div className="pay-box">
      <button type="button" className="order-btn" onClick={pay} disabled={loading}>
        {loading ? 'در حال انتقال...' : `پرداخت ${amount.toLocaleString('fa-IR')} تومان`}
      </button>
      {error && <span className="form-error" style={{ display: 'block', marginTop: 8 }}>{error}</span>}
    </div>
  );
}
