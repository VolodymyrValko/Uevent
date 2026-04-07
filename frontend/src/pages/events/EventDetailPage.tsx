import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { eventsService, commentsService, companiesService, paymentsService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { Event, Comment } from '../../types';
import { getGoogleCalendarUrl } from '../../utils/calendar';
import { resolvePosterUrl } from '../../utils/posters';
import EventCard from '../../components/events/EventCard';
import styles from './EventDetailPage.module.scss';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const EventDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [similar, setSimilar] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discountPercent?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [isCompanySubscribed, setIsCompanySubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'comments' | 'attendees'>('about');

  useEffect(() => {
    if (!id) return;
    const eventId = parseInt(id);
    setLoading(true);
    Promise.all([
      eventsService.getOne(eventId),
      eventsService.getSimilar(eventId),
      eventsService.getAttendees(eventId),
      commentsService.getForEvent(eventId),
    ]).then(([ev, sim, att, coms]) => {
      setEvent(ev);
      setSimilar(sim);
      setAttendees(att.attendees ?? []);
      setComments(coms.items);
    }).finally(() => setLoading(false));
  }, [id]);

  const handlePromoValidate = async () => {
    if (!event || !promoCode.trim()) return;
    const result = await eventsService.validatePromoCode(promoCode.trim(), event.id);
    setPromoResult(result);
  };

  const handleBuy = async () => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (!event) return;
    setBuying(true);
    try {
      const res = await paymentsService.createCheckout(event.id, promoResult?.valid ? promoCode : undefined);
      if (res.url) {
        if (res.mockMode) navigate(res.url);
        else window.location.href = res.url;
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.error'));
    } finally { setBuying(false); }
  };

  const handleEventSubscribe = async () => {
    if (!event) return;
    if (event.isSubscribed) {
      await eventsService.unsubscribe(event.id);
      setEvent((e) => e ? { ...e, isSubscribed: false } : e);
    } else {
      await eventsService.subscribe(event.id);
      setEvent((e) => e ? { ...e, isSubscribed: true } : e);
    }
  };

  const handleCompanySubscribe = async () => {
    if (!event?.company) return;
    if (isCompanySubscribed) {
      await companiesService.unsubscribe(event.company.id);
      setIsCompanySubscribed(false);
    } else {
      await companiesService.subscribe(event.company.id);
      setIsCompanySubscribed(true);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !commentText.trim()) return;
    const comment = await commentsService.create(event.id, commentText.trim());
    setComments((prev) => [{ ...comment, user: user as any }, ...prev]);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    await commentsService.delete(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!event) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>{t('events.detail.notFound')}</div>;

  const isFree = Number(event.price) === 0;
  const isSoldOut = event.ticketsSold >= event.maxTickets;
  const posterSrc = resolvePosterUrl(event.poster);
  const finalPrice = promoResult?.valid && promoResult.discountPercent
    ? Number(event.price) * (1 - promoResult.discountPercent / 100)
    : Number(event.price);

  const TAB_LABELS: Record<string, string> = {
    about: t('events.detail.about'),
    comments: t('events.detail.comments'),
    attendees: t('events.detail.attendees'),
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero} style={{ backgroundImage: `url(${posterSrc})` }}>
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <span className={`badge badge--${event.format}`}>{t(`events.formats.${event.format}`)}</span>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          <div className={styles.heroMeta}>
            <span>{format(new Date(event.date), 'dd.MM.yyyy · HH:mm')}</span>
            <span>{event.location}</span>
            {event.company && <span>{event.company.name}</span>}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.layout}>
          <div className={styles.main}>
            <div className={styles.tabs}>
              {(['about', 'comments', 'attendees'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {TAB_LABELS[tab]}
                  {tab === 'comments' && comments.length > 0 && <span className={styles.tabCount}>{comments.length}</span>}
                  {tab === 'attendees' && attendees.length > 0 && <span className={styles.tabCount}>{attendees.length}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <div className={styles.section}>
                <p className={styles.description}>{event.description}</p>

                {event.latitude && event.longitude && (
                  <div className={styles.mapWrap}>
                    <h2 className={styles.sectionTitle}>{t('events.detail.location')}</h2>
                    <MapContainer
                      center={[Number(event.latitude), Number(event.longitude)]}
                      zoom={14}
                      className={styles.map}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
                      />
                      <Marker position={[Number(event.latitude), Number(event.longitude)]}>
                        <Popup>{event.title}<br />{event.location}</Popup>
                      </Marker>
                    </MapContainer>
                    <p className={styles.locationText}>{event.location}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className={styles.section}>
                {isAuthenticated && (
                  <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                    <div className={styles.commentInputRow}>
                      <div className={styles.commentAvatar}>
                        {user?.avatar
                          ? <img src={user.avatar.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL}${user.avatar}`} alt="" />
                          : <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                        }
                      </div>
                      <textarea
                        className="field__textarea"
                        placeholder={t('events.detail.commentPlaceholder')}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn btn--primary btn--sm" disabled={!commentText.trim()}>
                        {t('events.detail.postComment')}
                      </button>
                    </div>
                  </form>
                )}

                <div className={styles.commentsList}>
                  {comments.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state__icon">💬</div>
                      <div className="empty-state__title">{t('events.detail.noComments')}</div>
                      <div className="empty-state__body">{t('events.detail.noCommentsHint')}</div>
                    </div>
                  ) : comments.map((c) => (
                    <div key={c.id} className={styles.comment}>
                      <div className={styles.commentAvatar}>
                        {c.user?.avatar
                          ? <img src={c.user.avatar.startsWith('http') ? c.user.avatar : `${process.env.REACT_APP_API_URL}${c.user.avatar}`} alt="" />
                          : <span>{c.user?.firstName?.[0]}{c.user?.lastName?.[0]}</span>
                        }
                      </div>
                      <div className={styles.commentContent}>
                        <div className={styles.commentHeader}>
                          <span className={styles.commentAuthor}>{c.user?.firstName} {c.user?.lastName}</span>
                          <span className={styles.commentDate}>{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                          {(user?.id === c.userId || user?.role === 'admin') && (
                            <button className={styles.deleteComment} onClick={() => handleDeleteComment(c.id)} title={t('common.delete')}>✕</button>
                          )}
                        </div>
                        <p className={styles.commentText}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'attendees' && (
              <div className={styles.section}>
                {attendees.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon">👥</div>
                    <div className="empty-state__title">{t('events.detail.noAttendees')}</div>
                    <div className="empty-state__body">{t('events.detail.noAttendeesHint')}</div>
                  </div>
                ) : (
                  <div className={styles.attendeesList}>
                    {attendees.map((a, i) => (
                      <div key={i} className={styles.attendee}>
                        {a.avatar
                          ? <img src={a.avatar.startsWith('http') ? a.avatar : `${process.env.REACT_APP_API_URL}${a.avatar}`} alt={a.name} />
                          : <span className={styles.attendeeInitial}>{a.name?.[0]}</span>
                        }
                        <span>{a.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {similar.length > 0 && (
              <div className={styles.similarSection}>
                <h2 className={styles.sectionTitle}>{t('events.detail.similar')}</h2>
                <div className={styles.similarGrid}>
                  {similar.map((e) => <EventCard key={e.id} event={e} />)}
                </div>
              </div>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.ticketBox}>
              <div className={styles.ticketPrice}>
                {isFree ? (
                  <span className="badge badge--free" style={{ fontSize: '1.1rem', padding: '6px 14px' }}>{t('events.card.free')}</span>
                ) : (
                  <>
                    {promoResult?.valid && (
                      <span className={styles.originalPrice}>${Number(event.price).toFixed(2)}</span>
                    )}
                    <span className={styles.priceAmount}>${finalPrice.toFixed(2)}</span>
                    {promoResult?.valid && (
                      <span className={styles.discountBadge}>-{promoResult.discountPercent}%</span>
                    )}
                  </>
                )}
              </div>
              <p className={styles.ticketsLeft}>
                {isSoldOut
                  ? t('events.detail.soldOut')
                  : t('events.detail.ticketsLeft', { sold: event.maxTickets - event.ticketsSold, max: event.maxTickets })}
              </p>

              {!isFree && !isSoldOut && (
                <div className={styles.promoRow}>
                  <input
                    className="field__input"
                    placeholder={t('events.detail.promoCode')}
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoResult(null); }}
                  />
                  <button className="btn btn--secondary btn--sm" onClick={handlePromoValidate}>{t('events.detail.apply')}</button>
                </div>
              )}
              {promoResult && (
                <p className={promoResult.valid ? styles.promoSuccess : styles.promoError}>
                  {promoResult.valid
                    ? t('events.detail.discountApplied', { percent: promoResult.discountPercent })
                    : t('events.detail.promoInvalid')}
                </p>
              )}

              <button
                className={`btn btn--primary btn--full ${buying ? 'btn--loading' : ''}`}
                onClick={handleBuy}
                disabled={isSoldOut || buying}
              >
                {isSoldOut
                  ? t('events.detail.soldOut')
                  : isFree
                    ? t('events.detail.registerFree')
                    : buying
                      ? t('events.detail.processing')
                      : t('events.detail.buyTicket')}
              </button>
            </div>

            {isAuthenticated && (
              <div className={styles.subscribeActions}>
                <button
                  className={`btn ${event.isSubscribed ? 'btn--secondary' : 'btn--ghost'} btn--full btn--sm`}
                  onClick={handleEventSubscribe}
                >
                  {event.isSubscribed ? t('events.detail.subscribedUpdates') : t('events.detail.subscribeUpdates')}
                </button>
                {event.company && (
                  <button
                    className={`btn ${isCompanySubscribed ? 'btn--secondary' : 'btn--ghost'} btn--full btn--sm`}
                    onClick={handleCompanySubscribe}
                  >
                    {isCompanySubscribed ? t('events.detail.followingOrganizer') : t('events.detail.followOrganizer')}
                  </button>
                )}
              </div>
            )}

            <a
              className="btn btn--ghost btn--full btn--sm"
              href={getGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('events.detail.addToCalendar')}
            </a>

            {event.company && (
              <Link to={`/companies/${event.company.id}`} className={styles.organizerCard}>
                {event.company.logo
                  ? <img src={`${process.env.REACT_APP_API_URL}${event.company.logo}`} alt={event.company.name} className={styles.orgLogo} />
                  : <div className={styles.orgLogoPlaceholder}>{event.company.name[0]}</div>
                }
                <div>
                  <p className={styles.orgLabel}>{t('events.detail.organizer')}</p>
                  <p className={styles.orgName}>{event.company.name}</p>
                  {event.company.location && <p className={styles.orgLocation}>{event.company.location}</p>}
                </div>
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
