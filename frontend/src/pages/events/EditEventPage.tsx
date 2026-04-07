import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../services';
import { Event } from '../../types';

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    eventsService.getOne(parseInt(id))
      .then(setEvent)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true); setError('');
    try {
      const fd = new FormData(e.currentTarget);
      await eventsService.update(event.id, fd);
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to update event');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!event) return null;

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 32 }}>
          Edit Event
        </h1>
        {error && (
          <div style={{ background: 'rgba(255,69,96,0.1)', border: '1px solid rgba(255,69,96,0.3)', color: 'var(--color-error)', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: '0.88rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="field">
            <label className="field__label">Title</label>
            <input name="title" className="field__input" defaultValue={event.title} required maxLength={200} />
          </div>
          <div className="field">
            <label className="field__label">Description</label>
            <textarea name="description" className="field__textarea" defaultValue={event.description} rows={6} required />
          </div>
          <div className="field">
            <label className="field__label">Location</label>
            <input name="location" className="field__input" defaultValue={event.location} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label className="field__label">Price (USD)</label>
              <input name="price" type="number" min="0" step="0.01" className="field__input" defaultValue={event.price} />
            </div>
            <div className="field">
              <label className="field__label">Max tickets</label>
              <input name="maxTickets" type="number" min="1" className="field__input" defaultValue={event.maxTickets} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className={`btn btn--primary ${saving ? 'btn--loading' : ''}`} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage;
