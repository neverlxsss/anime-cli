import input from '@inquirer/input';
import { select } from '@inquirer/prompts';
import clear from 'clear';
import { exec } from 'child_process';

import { shikimoriSearch } from './api/shikimori.js';
import { kodikSearch, kodikExtractLinks } from './api/kodik.js';
import { config, loadConfig, saveConfig } from './config/index.js';


// Comment this while dev. This fixes ctrl + c close errors
//process.on('unhandledRejection', () => {
// pass
//});

const bootstrap = async (setAll = false) => {
  await loadConfig();

  for (const key in config) {
    if (Object.hasOwnProperty.call(config, key)) {
      const property = config[key];
      if ((!property.value && property.required) || setAll) {
        config[key].value = await input({ message: `Set ${key}. Current value ${property.value}:` });
      }
    }
  }
  
  await saveConfig();
};

(async () => {
  await bootstrap(process.argv.includes('--config'));

  clear();
  const animeName = await input({ message: 'Search anime:' });

  const shikimoryList = await shikimoriSearch(animeName);

  if (!shikimoryList.length) {
    return console.log('Nothing found');
  }

  const formattedShikimoryList = shikimoryList.map((animeInfo) => {
    return {
      name: animeInfo.russian,
      value: animeInfo.id
    };
  });

  clear();
  const selectedAnimeId = await select({
    message: 'Select anime from the list:',
    choices: formattedShikimoryList,
    loop: false,
    pageSize: formattedShikimoryList.length
  });

  const selectedAnimeName = formattedShikimoryList.find(a => a.value === selectedAnimeId).name;
  const selectedAnimeOriginalTitle = shikimoryList.find(a => a.id === selectedAnimeId).name;

  clear();
  const kodikList = await kodikSearch(selectedAnimeId);

  const formattedKodikList = kodikList.results.map((animeInfo) => {
    return {
      name: animeInfo.translation.title,
      value: animeInfo.id
    };
  });
  
  if (!kodikList.total) {
    return console.log('Nothing found');
  }

  const selectedTranslationId = await select({
    message: 'Select translation from the list:',
    choices: formattedKodikList,
    loop: false,
    pageSize: formattedKodikList.length
  });

  const selectedKodikAnimeInfo = kodikList.results.find(a => a.id === selectedTranslationId);
  const seasons = Object.keys(selectedKodikAnimeInfo.seasons);
  
  let selectedSeason = null;
  if (seasons.length > 1) {
    const seasonsList = seasons.map((season) => {
      return {
        name: season,
        value: season
      };
    });

    clear();
    selectedSeason = await select({
      message: 'Select season from the list:',
      choices: seasonsList,
      loop: false,
      pageSize: 10
    });
  } else {
    selectedSeason = seasons[0];
  }

  const episodes = Object.keys(selectedKodikAnimeInfo.seasons[selectedSeason.toString()].episodes);
  let selectedEpisode = null;
  if (episodes.length > 1) {
    const episodesList = episodes.map((episode) => {
      return {
        name: episode,
        value: episode
      };
    });

    clear();
    selectedEpisode = await select({
      message: 'Select episode from the list:',
      choices: episodesList,
      loop: false,
      pageSize: 10
    });
  } else {
    selectedEpisode = episodes[0];
  }

  let streamInfo = await kodikExtractLinks(selectedKodikAnimeInfo.seasons[selectedSeason.toString()].episodes[selectedEpisode.toString()]);

  const formattedQuality = Object.keys(streamInfo.links).map((quality) => {
    return {
      name: quality,
      value: quality,
    };
  });
  formattedQuality.sort().reverse();

  clear();
  let selectedQuality = await select({
    message: 'Select quality from the list:',
    choices: formattedQuality,
    loop: false,
    pageSize: 10
  });

  let choice = null;

  while (choice !== 'quit') {
    choice = null;
    streamInfo = await kodikExtractLinks(selectedKodikAnimeInfo.seasons[selectedSeason.toString()].episodes[selectedEpisode.toString()]);
    let streamLink = streamInfo.links[selectedQuality.toString()][0].src;

    if (streamLink.startsWith('//')) {
      streamLink = `https:${streamLink}`;
    }

    let launchStr = `mpv ${config.MPV_ADDITIONAL_PARAMS.value} ${streamLink} --title="${selectedAnimeName} // episode ${selectedEpisode}"`;
    if (config.ANISKIP.value) {
      launchStr += ` $(ani-skip "${selectedAnimeOriginalTitle}" ${selectedEpisode})`;
    }
    console.log(launchStr);
    exec(launchStr);

    //clear();
    choice = await select({
      message: `Playing episode ${selectedEpisode}/${episodes.at(episodes.length - 1)} of ${selectedAnimeName}`,
      choices: [
        {
          name: 'Next',
          value: 'next',
        },
        {
          name: 'Replay',
          value: 'replay',
        },
        {
          name: 'Previous',
          value: 'previous',
        },
        {
          name: 'Select',
          value: 'select',
        },
        {
          name: 'Change quality',
          value: 'quality',
        },
        {
          name: 'Quit',
          value: 'quit',
        },
      ]
    });

    switch (choice) {
    case 'next': {
      if (++selectedEpisode > episodes.at(episodes.length - 1)) {
        console.log('No more episodes');
        process.exit(0);
      }
      break;
    }
    case 'previous': {
      if (--selectedEpisode < episodes.at(0)) {
        console.log('Episode not found');
        process.exit(0);
      }
      break;
    }
    case 'select': {
      const episodesList = episodes.map((episode) => {
        return {
          name: episode,
          value: episode
        };
      });

      selectedEpisode = await select({
        message: 'Select episode from the list:',
        choices: episodesList,
        loop: false,
        pageSize: 10
      });
      break;
    }
    case 'quality': {
      clear();
      selectedQuality = await select({
        message: 'Select quality from the list:',
        choices: formattedQuality,
        loop: false,
        pageSize: 10
      });
      break;
    }
    case 'replay':
    default:
      break;
    }
  }
})();