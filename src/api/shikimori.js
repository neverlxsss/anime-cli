import { API } from 'shikimori';

export const shikimoriSearch = (query, limit = 10) => {
  const shikimori = new API();

  const list = shikimori.animes.get({
    search: query,
    limit,
  });

  return list;
};