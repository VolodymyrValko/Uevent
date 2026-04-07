export interface StandardPoster {
  id: string;
  url: string;
  label: string;
  theme: string;
}

export const STANDARD_POSTERS: StandardPoster[] = [
  {
    id: 'tech-conf',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    label: 'Tech Conference',
    theme: 'technology',
  },
  {
    id: 'workshop',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
    label: 'Workshop',
    theme: 'technology',
  },
  {
    id: 'business',
    url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&q=80',
    label: 'Business',
    theme: 'business',
  },
  {
    id: 'startup',
    url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
    label: 'Startup',
    theme: 'business',
  },
  {
    id: 'science',
    url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=1200&q=80',
    label: 'Science',
    theme: 'science',
  },
  {
    id: 'space',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
    label: 'Space & Cosmos',
    theme: 'science',
  },
  {
    id: 'psychology',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    label: 'Psychology',
    theme: 'psychology',
  },
  {
    id: 'politics',
    url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80',
    label: 'Politics & Society',
    theme: 'politics',
  },
  {
    id: 'music-fest',
    url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    label: 'Music Fest',
    theme: 'entertainment',
  },
  {
    id: 'gaming',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80',
    label: 'Gaming',
    theme: 'entertainment',
  },
  {
    id: 'lecture',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
    label: 'Lecture Hall',
    theme: 'other',
  },
  {
    id: 'networking',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
    label: 'Networking',
    theme: 'other',
  },
];

export const DEFAULT_POSTER = STANDARD_POSTERS[0].url;

export function resolvePosterUrl(poster: string | null | undefined): string {
  if (!poster) return DEFAULT_POSTER;
  if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
  return `${process.env.REACT_APP_API_URL}${poster}`;
}
