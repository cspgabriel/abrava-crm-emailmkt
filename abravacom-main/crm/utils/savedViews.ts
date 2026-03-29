// utils/savedViews.ts
// Helper functions for managing saved views (Firestore collection: savedViews)

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';

const COL = 'savedViews';

export type SavedView = {
  id?: string;
  name: string;
  entityType: 'contact' | 'company';
  filters: Record<string, string[]>;
  ownerUid?: string;
  isDefault?: boolean;
  createdAt?: any;
};

/** Creates a new saved view document and returns its ID. */
export async function firestoreCreateView(
  data: Omit<SavedView, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    isDefault: data.isDefault ?? false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Renames a saved view. */
export async function firestoreRenameView(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { name: name.trim() });
}

/** Deletes a saved view document. */
export async function firestoreDeleteView(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/**
 * Sets a view as the default for its entityType.
 * Unsets isDefault on all other views of the same entityType first.
 */
export async function firestoreSetDefaultView(
  entityType: string,
  viewId: string
): Promise<void> {
  const q = query(
    collection(db, COL),
    where('entityType', '==', entityType),
    where('isDefault', '==', true)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.forEach(d => {
    if (d.id !== viewId) batch.update(doc(db, COL, d.id), { isDefault: false });
  });
  batch.update(doc(db, COL, viewId), { isDefault: true });
  await batch.commit();
}

/** Removes the default flag from a single view. */
export async function firestoreUnsetDefaultView(viewId: string): Promise<void> {
  await updateDoc(doc(db, COL, viewId), { isDefault: false });
}

/**
 * List views for a user, optionally filtered by entityType.
 */
export async function firestoreListViews(ownerUid: string, entityType?: string) {
  let q = query(collection(db, COL), where('ownerUid', '==', ownerUid));
  if (entityType) q = query(collection(db, COL), where('ownerUid', '==', ownerUid), where('entityType', '==', entityType));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

/**
 * Retrieve the default view for a given owner/entity type.
 */
export async function firestoreGetDefaultView(ownerUid: string, entityType: string) {
  const q = query(
    collection(db, COL),
    where('ownerUid', '==', ownerUid),
    where('entityType', '==', entityType),
    where('isDefault', '==', true)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
}
