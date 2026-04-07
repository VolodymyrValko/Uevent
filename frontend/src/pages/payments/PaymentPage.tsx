import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentsService } from '../../services';
import styles from './PaymentPage.module.scss';

const PaymentPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = parseInt(params.get('eventId') ?? '0');
  const price = parseFloat(params.get('price') ?? '0');
  const promoCode = params.get('promoCode') || undefined;

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (f: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((p) => ({ ...p, [f]: e.target.value }));

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val: string) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/^(.{2})(.+)/, '$1/$2');

  const validate = (): string => {
    if (card.number.replace(/\s/g, '').length < 16) return 'Enter a valid 16-digit card number';
    if (card.expiry.length < 5) return 'Enter a valid expiry date (MM/YY)';
    if (card.cvv.length < 3) return 'Enter a valid CVV';
    if (!card.name.trim()) return 'Cardholder name is required';
    return '';
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);
    try {
      const result = await paymentsService.mockPay(eventId, price, promoCode);
      navigate(`/tickets/${result.ticket.id}?new=1`);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Payment failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Secure Checkout</h1>
            <div className={styles.mockBadge}>🧪 Dev / Mock mode</div>
          </div>

          <div className={styles.amount}>
            <span className={styles.amountLabel}>Total</span>
            <span className={styles.amountValue}>${price.toFixed(2)}</span>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handlePay} className={styles.form} noValidate>
            <div className="field">
              <label className="field__label">Cardholder name</label>
              <input
                className="field__input"
                placeholder="John Doe"
                value={card.name}
                onChange={setField('name')}
                autoComplete="cc-name"
              />
            </div>

            <div className="field">
              <label className="field__label">Card number</label>
              <input
                className="field__input"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard((p) => ({ ...p, number: formatCardNumber(e.target.value) }))}
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
              />
            </div>

            <div className={styles.twoCol}>
              <div className="field">
                <label className="field__label">Expiry</label>
                <input
                  className="field__input"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={(e) => setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  maxLength={5}
                />
              </div>
              <div className="field">
                <label className="field__label">CVV</label>
                <input
                  className="field__input"
                  placeholder="123"
                  value={card.cvv}
                  onChange={setField('cvv')}
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                />
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn--primary btn--full btn--lg ${loading ? 'btn--loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Processing…' : `Pay $${price.toFixed(2)}`}
            </button>

            <p className={styles.mockNote}>
              This is a mock payment form. Use any 16-digit number, any future expiry, and any CVV.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
