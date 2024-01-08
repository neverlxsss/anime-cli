import { Client, VideoLinks } from 'kodikwrapper';
import { config } from '../config/index.js';


export const kodikSearch = async (shikimoriId, limit = 100) => {
  const client = new Client({
    token: config.KODIK_TOKEN.value,
  });
  
  const list = await client.search({
    shikimori_id: shikimoriId,
    with_episodes: true,
    with_seasons: true,
    limit,
  });

  return list;
}; 

export const kodikExtractLinks = async (url) => {
  const result = await VideoLinks.getLinks({extended: true, link: url});

  return result;
};