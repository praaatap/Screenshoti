import {useCallback, useState} from 'react';
import {Alert, Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  openSettings,
  request,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';

interface UsePermissionsResult {
  hasPhotoPermission: boolean;
  isRequestingPermission: boolean;
  ensurePhotoPermission: () => Promise<boolean>;
}

const getPhotoPermission = (): Permission | null => {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.PHOTO_LIBRARY;
  }

  if (Platform.OS === 'android') {
    const sdkVersion = typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);

    if (sdkVersion >= 33) {
      return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    }

    return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
  }

  return null;
};

const isAuthorized = (status: PermissionStatus): boolean => {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
};

export const usePermissions = (): UsePermissionsResult => {
  const [hasPhotoPermission, setHasPhotoPermission] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const ensurePhotoPermission = useCallback(async (): Promise<boolean> => {
    const permission = getPhotoPermission();

    if (!permission) {
      setHasPhotoPermission(true);
      return true;
    }

    setIsRequestingPermission(true);

    try {
      const currentStatus = await check(permission);

      if (isAuthorized(currentStatus)) {
        setHasPhotoPermission(true);
        return true;
      }

      const requestedStatus = await request(permission);

      if (isAuthorized(requestedStatus)) {
        setHasPhotoPermission(true);
        return true;
      }

      setHasPhotoPermission(false);

      Alert.alert(
        'Permission needed',
        'Please allow photo library access to load your screenshots.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: () => {
              void openSettings();
            },
          },
        ],
      );

      return false;
    } catch {
      setHasPhotoPermission(false);
      Alert.alert('Permission error', 'Failed to request media permissions.');
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  return {
    hasPhotoPermission,
    isRequestingPermission,
    ensurePhotoPermission,
  };
};
