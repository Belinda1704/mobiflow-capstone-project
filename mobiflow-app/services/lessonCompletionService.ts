import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function markLessonCompleted(userId: string, lessonId: string): Promise<void> {
  if (!userId || !lessonId) return;
  const ref = doc(db, 'users', userId, 'lessonCompletions', lessonId);
  await setDoc(ref, { completedAt: serverTimestamp() });
}

export async function isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
  if (!userId || !lessonId) return false;
  const ref = doc(db, 'users', userId, 'lessonCompletions', lessonId);
  const snap = await getDoc(ref);
  return snap.exists();
}
