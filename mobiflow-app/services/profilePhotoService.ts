// Upload profile picture to Storage, return URL.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../config/firebase';

// Upload photo; save as profilePhotos/{userId}.{ext}, return URL.
export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `profilePhotos/${user.uid}.${ext}`;
  const storageRef = ref(storage, filename);

  const response = await fetch(localUri);
  const blob = await response.blob();
  const metadata = { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` };
  await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(storageRef);
}
