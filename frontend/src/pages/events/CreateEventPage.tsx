import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { eventsService, companiesService } from '../../services';
import { Company, EventFormat, EventTheme, VisitorListVisibility } from '../../types';
import { STANDARD_POSTERS } from '../../utils/posters';
import styles from './CreateEventPage.module.scss';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface FormState {
  title: string;
  description: string;
  format: EventFormat | '';
  theme: EventTheme | '';
  date: string;
  publishDate: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  price: string;
  maxTickets: string;
  visitorListVisibility: VisitorListVisibility;
  notifyOnNewVisitor: boolean;
  redirectAfterPurchase: string;
  posterUrl: string;
  companyId: string;
}

const MapPicker: React.FC<{
  position: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}> = ({ position, onPick }) => {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return position ? <Marker position={position} /> : null;
};

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    title: '', description: '', format: '', theme: '',
    date: '', publishDate: '', location: '',
    latitude: null, longitude: null,
    price: '0', maxTickets: '100',
    visitorListVisibility: VisitorListVisibility.EVERYONE,
    notifyOnNewVisitor: false,
    redirectAfterPurchase: '',
    posterUrl: '',
    companyId: '',
  });

  useEffect(() => {
    companiesService.getMine().then((list) => {
      setCompanies(list);
      if (list.length === 1) setForm((p) => ({ ...p, companyId: String(list[0].id) }));
    }).catch(() => {});
  }, []);

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
  }, []);

  const validateStep = (): string => {
    if (step === 1) {
      if (!form.companyId) return 'Please select a company';
      if (!form.title.trim()) return 'Title is required';
      if (!form.description.trim()) return 'Description is required';
      if (!form.format) return 'Please select a format';
      if (!form.theme) return 'Please select a theme';
    }
    if (step === 2) {
      if (!form.date) return 'Event date is required';
      if (new Date(form.date) <= new Date()) return 'Event date must be in the future';
      if (!form.location.trim()) return 'Location is required';
    }
    if (step === 3) {
      if (Number(form.price) < 0) return 'Price cannot be negative';
      if (Number(form.maxTickets) < 1) return 'Must have at least 1 ticket';
    }
    return '';
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const handleCreate = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(''); setLoading(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== '') fd.append(k, String(v));
      });
      if (posterFile) {
        fd.append('poster', posterFile);
        fd.delete('posterUrl');
      }

      const event = await eventsService.create(fd);
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to create event');
    } finally { setLoading(false); }
  };

  const STEPS = ['Basic info', 'Date & Location', 'Tickets & Settings'];

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        <h1 className={styles.heading}>Create Event</h1>

        <div className={styles.steps}>
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`${styles.stepItem} ${step > i + 1 ? styles.stepDone : ''} ${step === i + 1 ? styles.stepActive : ''}`}>
                <div className={styles.stepCircle}>{step > i + 1 ? '✓' : i + 1}</div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${step > i + 1 ? styles.stepLineDone : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className="field">
                <label className="field__label">Company *</label>
                {companies.length === 0 ? (
                  <p style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>
                    You don't have any companies yet.{' '}
                    <button type="button" className="btn btn--ghost btn--sm" style={{ display: 'inline' }} onClick={() => navigate('/profile/company')}>
                      Create a company first
                    </button>
                  </p>
                ) : (
                  <select className="field__select" value={form.companyId} onChange={setField('companyId')}>
                    {companies.length > 1 && <option value="">Select company…</option>}
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="field">
                <label className="field__label">Event title *</label>
                <input className="field__input" placeholder="e.g. TypeScript Summit 2025" value={form.title} onChange={setField('title')} maxLength={200} />
              </div>

              <div className="field">
                <label className="field__label">Description *</label>
                <textarea className="field__textarea" placeholder="Tell people what your event is about…" value={form.description} onChange={setField('description')} rows={6} />
              </div>

              <div className={styles.twoCol}>
                <div className="field">
                  <label className="field__label">Format *</label>
                  <select className="field__select" value={form.format} onChange={setField('format')}>
                    <option value="">Select format…</option>
                    {Object.values(EventFormat).map((f) => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">Theme *</label>
                  <select className="field__select" value={form.theme} onChange={setField('theme')}>
                    <option value="">Select theme…</option>
                    {Object.values(EventTheme).map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field__label">Poster image</label>

                {(posterPreview || form.posterUrl) && (
                  <div className={styles.posterPreview}>
                    <img src={posterPreview || form.posterUrl} alt="Poster preview" />
                    <button
                      type="button"
                      className={styles.removePoster}
                      onClick={() => { setPosterPreview(null); setPosterFile(null); setForm(p => ({ ...p, posterUrl: '' })); }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}

                {!posterPreview && !form.posterUrl && (
                  <div className={styles.posterUpload}>
                    <button
                      type="button"
                      className={styles.posterPickerBtn}
                      onClick={() => setPosterPickerOpen(p => !p)}
                    >
                      🎨 Choose standard poster
                    </button>
                    <span className={styles.posterOr}>or</span>
                    <label className={styles.posterLabel}>
                      <span className={styles.posterIcon}>⬆</span>
                      <span>Upload your own</span>
                      <span className={styles.posterHint}>JPG, PNG, WebP · Max 5MB</span>
                      <input type="file" accept="image/*" onChange={handlePosterChange} className={styles.posterInput} />
                    </label>
                  </div>
                )}

                {posterPickerOpen && !posterPreview && !form.posterUrl && (
                  <div className={styles.standardPosters}>
                    {STANDARD_POSTERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.standardPosterBtn}
                        onClick={() => {
                          setForm(f => ({ ...f, posterUrl: p.url }));
                          setPosterPickerOpen(false);
                        }}
                      >
                        <img src={p.url} alt={p.label} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className="field">
                <label className="field__label">Event date & time *</label>
                <input className="field__input" type="datetime-local" value={form.date} onChange={setField('date')} />
              </div>

              <div className="field">
                <label className="field__label">Location *</label>
                <input className="field__input" placeholder="e.g. Kyiv, Ukraine, Arena City" value={form.location} onChange={setField('location')} />
              </div>

              <div className="field">
                <label className="field__label">
                  Pin on map
                  {form.latitude && <span className={styles.coordsBadge}> {form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)}</span>}
                </label>
                <div className={styles.mapWrap}>
                  <MapContainer center={[48.3794, 31.1656]} zoom={5} className={styles.map}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapPicker
                      position={form.latitude !== null && form.longitude !== null ? [form.latitude, form.longitude] : null}
                      onPick={handleMapPick}
                    />
                  </MapContainer>
                </div>
                <span className={styles.hint}>Click anywhere on the map to set coordinates</span>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.twoCol}>
                <div className="field">
                  <label className="field__label">Price (USD) *</label>
                  <input className="field__input" type="number" min="0" step="0.01" placeholder="0 for free" value={form.price} onChange={setField('price')} />
                  <span className={styles.hint}>Set to 0 for a free event</span>
                </div>
                <div className="field">
                  <label className="field__label">Max tickets *</label>
                  <input className="field__input" type="number" min="1" value={form.maxTickets} onChange={setField('maxTickets')} />
                </div>
              </div>

              <div className="field">
                <label className="field__label">Attendee list visibility</label>
                <select className="field__select" value={form.visitorListVisibility} onChange={setField('visitorListVisibility')}>
                  <option value={VisitorListVisibility.EVERYONE}>Everyone can see attendees</option>
                  <option value={VisitorListVisibility.ATTENDEES_ONLY}>Only attendees can see the list</option>
                </select>
              </div>

              <div className={styles.checkField}>
                <input type="checkbox" id="notify" checked={form.notifyOnNewVisitor} onChange={setField('notifyOnNewVisitor')} />
                <label htmlFor="notify">
                  <span className={styles.checkTitle}>Notify me when someone buys a ticket</span>
                  <span className={styles.checkHint}>You'll get an in-app notification for each new purchase</span>
                </label>
              </div>

              <div className="field">
                <label className="field__label">Redirect URL after purchase (optional)</label>
                <input className="field__input" type="url" placeholder="https://mysite.com/thank-you" value={form.redirectAfterPurchase} onChange={setField('redirectAfterPurchase')} />
                <span className={styles.hint}>Attendees are redirected here after buying a ticket</span>
              </div>
            </div>
          )}

          <div className={styles.navRow}>
            {step > 1 && (
              <button type="button" className="btn btn--secondary" onClick={() => { setError(''); setStep((s) => s - 1); }}>
                ← Back
              </button>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>Cancel</button>
              {step < 3 ? (
                <button type="button" className="btn btn--primary" onClick={nextStep}>
                  Next →
                </button>
              ) : (
                <button type="button" className={`btn btn--primary ${loading ? 'btn--loading' : ''}`} disabled={loading} onClick={handleCreate}>
                  {loading ? 'Creating…' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
