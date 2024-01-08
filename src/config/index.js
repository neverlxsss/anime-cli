import { promises as fs } from 'fs';
import path from 'path';

export let config = {
  KODIK_TOKEN: {required: true, value: null},
  MPV_ADDITIONAL_PARAMS: {required: false, value: null},
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
  config = JSON.parse(file.toString());
};

export const saveConfig = async () => {
  await fs.writeFile(filePath, JSON.stringify(config));
};