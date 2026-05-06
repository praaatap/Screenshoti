import type {LinkingOptions} from '@react-navigation/native';
import type {RootStackParamList} from '../types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'screenshoti://',
    'https://app.screenshoti.app',
  ],
  config: {
    screens: {
      Main: '',
      Detail: {
        path: 'screenshot/:screenshotId',
        parse: {screenshotId: String},
      },
      AlbumDetail: {
        path: 'album/:albumId/:albumName',
        parse: {albumId: String, albumName: String},
      },
      Search: 'search',
      PinLock: 'lock',
    },
  },
};
