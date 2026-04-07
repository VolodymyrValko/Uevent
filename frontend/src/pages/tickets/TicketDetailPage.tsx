import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { ticketsService } from '../../services';
import { Ticket } from '../../types';
import { resolvePosterUrl } from '../../utils/posters';
import styles from './TicketDetailPage.module.scss';

const TicketDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === '1';
  const [ticket, setTicket] = useState<(Ticket & { qrCodeDataUrl: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ticketsService.getOne(parseInt(id))
      .then(setTicket)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!ticket) return <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>Ticket not found.</div>;

  const event = ticket.event;
  const posterSrc = event?.poster ? resolvePosterUrl(event.poster) : undefined;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.container}`}>
        {isNew && (
          <div className={styles.successBanner}>
            {t('tickets.confirmed')}
          </div>
        )}

        <div className={styles.ticket}>
          <div className={styles.left}>
            {posterSrc && <img src={posterSrc} alt={event?.title} className={styles.poster} />}
            <div className={styles.eventInfo}>
              <span className={`badge badge--${event?.format ?? 'other'}`}>{event?.format ? t(`events.formats.${event.format}`) : ''}</span>
              <h1 className={styles.eventTitle}>{event?.title}</h1>
              {event?.date && (
                <p className={styles.meta}>{format(new Date(event.date), 'dd.MM.yyyy · HH:mm')}</p>
              )}
              {event?.location && <p className={styles.meta}>{event.location}</p>}
              {event?.company && <p className={styles.meta}>{event.company.name}</p>}
            </div>
          </div>

          <div className={styles.divider}>
            <div className={styles.notch} />
            <div className={styles.dashedLine} />
            <div className={styles.notch} />
          </div>

          <div className={styles.right}>
            <p className={styles.ticketLabel}>{t('tickets.ticketNo', { id: ticket.id })}</p>
            <div className={styles.qrWrap}>
              <img src={ticket.qrCodeDataUrl} alt="QR Code" className={styles.qr} />
            </div>
            <p className={styles.qrCode}>{ticket.qrCode.slice(0, 20)}…</p>
            <div className={styles.ticketMeta}>
              <div className={styles.ticketMetaRow}>
                <span>{t('tickets.status')}</span>
                <span className={`${styles.status} ${styles[ticket.status]}`}>{t(`profile.ticketStatus.${ticket.status}`, { defaultValue: ticket.status })}</span>
              </div>
              <div className={styles.ticketMetaRow}>
                <span>{t('tickets.paid')}</span>
                <span>${Number(ticket.price).toFixed(2)}</span>
              </div>
              <div className={styles.ticketMetaRow}>
                <span>{t('tickets.purchased')}</span>
                <span>{format(new Date(ticket.purchaseDate), 'dd.MM.yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/profile/tickets" className="btn btn--secondary">{t('tickets.backToTickets')}</Link>
          {event && <Link to={`/events/${event.id}`} className="btn btn--ghost">{t('tickets.viewEvent')}</Link>}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
