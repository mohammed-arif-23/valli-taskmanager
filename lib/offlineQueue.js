import { openDB } from 'idb';

const DB_NAME = 'task-manager-offline';
const STORE_NAME = 'submissions';

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function addToQueue(taskId, payload) {
  const db = await getDB();
  const submission = {
    taskId,
    payload,
    timestamp: new Date().toISOString(),
    syncStatus: 'pending',
    retryCount: 0,
    error: null,
  };
  await db.add(STORE_NAME, submission);
  return submission;
}

export async function getQueue() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function markAsSynced(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function markAsFailed(id, error) {
  const db = await getDB();
  const submission = await db.get(STORE_NAME, id);
  if (submission) {
    submission.syncStatus = 'failed';
    submission.error = error;
    submission.retryCount += 1;
    await db.put(STORE_NAME, submission);
  }
}

export async function getPendingCount() {
  const queue = await getQueue();
  return queue.filter((item) => item.syncStatus === 'pending').length;
}
