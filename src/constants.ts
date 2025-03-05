import os from 'node:os';

export const isMacOS = os.platform() === 'darwin';
export const CHROME_USER_DATA_PATH = `${os.homedir()}/Library/Application Support/Google/Chrome`;
export const WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS = 11644473600;
