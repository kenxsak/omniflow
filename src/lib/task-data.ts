
"use client";

import type { Task } from '@/types/task';
import { db } from './firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';

// Helper to remove undefined values from an object (Firebase doesn't accept undefined)
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

// --- Task Functions (Firestore) ---

export async function getStoredTasks(companyId?: string): Promise<Task[]> {
  if (!db || !companyId) return [];
  try {
    const tasksCol = collection(db, 'tasks');
    const q = query(
      tasksCol, 
      where('companyId', '==', companyId)
    );
    const taskSnapshot = await getDocs(q);
    if (taskSnapshot.empty) {
        return [];
    }
    const tasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    // Sort client-side temporarily until Firestore indexes are deployed
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function addStoredTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' >): Promise<Task> {
  if (!db) throw new Error("Firestore is not initialized.");
  
  // Build the base payload
  const taskPayload: Record<string, any> = {
    title: taskData.title,
    notes: taskData.notes || '',
    priority: taskData.priority,
    status: taskData.status,
    dueDate: taskData.dueDate,
    companyId: taskData.companyId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Only add leadId and leadName if leadId exists
  if (taskData.leadId) {
    taskPayload.leadId = taskData.leadId;
    const leadSnap = await getDoc(doc(db, 'leads', taskData.leadId));
    if (leadSnap.exists()) {
      taskPayload.leadName = leadSnap.data().name;
    }
  }

  // Only add appointmentId and appointmentTitle if appointmentId exists
  if (taskData.appointmentId) {
    taskPayload.appointmentId = taskData.appointmentId;
    const appointmentSnap = await getDoc(doc(db, 'appointments', taskData.appointmentId));
    if (appointmentSnap.exists()) {
      taskPayload.appointmentTitle = appointmentSnap.data().title;
    }
  }

  const docRef = await addDoc(collection(db, 'tasks'), taskPayload);
  const docSnap = await getDoc(docRef);
  return { id: docSnap.id, ...docSnap.data() } as Task;
}

export async function updateStoredTask(updatedData: Partial<Task> & {id: string}): Promise<void> {
  if (!db) return;
  const { id, ...dataToUpdate } = updatedData;
  const taskRef = doc(db, 'tasks', id);
  
  // Build update payload without undefined values
  const updatePayload: Record<string, any> = {
    ...removeUndefinedFields(dataToUpdate),
    updatedAt: serverTimestamp(),
  };
  
  // Handle leadId and leadName
  if (updatedData.leadId && updatedData.leadId !== '_NONE_') {
    updatePayload.leadId = updatedData.leadId;
    const leadSnap = await getDoc(doc(db, 'leads', updatedData.leadId));
    if (leadSnap.exists()) {
      updatePayload.leadName = leadSnap.data().name;
    }
  } else if (updatedData.leadId === '_NONE_') {
    // Remove the fields if set to none
    updatePayload.leadId = null;
    updatePayload.leadName = null;
  }

  // Handle appointmentId and appointmentTitle
  if (updatedData.appointmentId && updatedData.appointmentId !== '_NONE_') {
    updatePayload.appointmentId = updatedData.appointmentId;
    const appointmentSnap = await getDoc(doc(db, 'appointments', updatedData.appointmentId));
    if (appointmentSnap.exists()) {
      updatePayload.appointmentTitle = appointmentSnap.data().title;
    }
  } else if (updatedData.appointmentId === '_NONE_') {
    // Remove the fields if set to none
    updatePayload.appointmentId = null;
    updatePayload.appointmentTitle = null;
  }

  await updateDoc(taskRef, updatePayload);
}

export async function deleteTask(taskId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'tasks', taskId));
}
