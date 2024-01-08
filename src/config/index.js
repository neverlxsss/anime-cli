import { promises as fs } from 'fs';
import path from 'path';

export let config = {
  KODIK_TOKEN: {required: true, value: null},
  MPV_ADDITIONAL_PARAMS: {required: false, value: null},
  ANISKIP: {required: false, value: false},
};
const dirPath = path.join(process.env.HOME, '.config/anime-cli');
const filePath = `${dirPath}/config.json`;

export const loadConfig = async () => {
  try {
    await fs.access(filePath);
  } catch(e) {
    try {
      await fs.mkdir(dirPath);
    } catch (e) {
      // Already exists
    }
    await saveConfig();
  }
  const file = await fs.readFile(filePath);
  const loadedConfig = JSON.parse(file.toString());

  config = { ...config, ...loadedConfig };
};

export const saveConfig = async () => {
  await fs.writeFile(filePath, JSON.stringify(config));
};