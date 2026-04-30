import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

export interface Expense {
  id?: string;
  userId: string;
  itemName: string;
  amount: number;
  category: string;
  emojiOrImageUrl?: string;
  timestamp: any;
  languageUsed: string;
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Others'
];

export const isArabicOrUrdu = (text: string) => {
  const urduRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return urduRegex.test(text);
};

export const addExpense = async (userId: string, data: Omit<Expense, 'userId' | 'timestamp' | 'languageUsed' | 'id'>) => {
  const expenseId = uuidv4();
  const path = `users/${userId}/expenses`;
  const expenseRef = doc(db, path, expenseId);
  
  const languageUsed = isArabicOrUrdu(data.itemName) ? 'urdu' : 'english';

  try {
    await setDoc(expenseRef, {
      userId,
      itemName: data.itemName,
      amount: Number(data.amount),
      category: data.category,
      emojiOrImageUrl: data.emojiOrImageUrl || '',
      languageUsed,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateExpense = async (userId: string, expenseId: string, data: Partial<Omit<Expense, 'userId' | 'timestamp' | 'id'>>) => {
  const path = `users/${userId}/expenses`;
  const expenseRef = doc(db, path, expenseId);

  try {
    const toUpdate: any = { ...data };
    if (data.amount !== undefined) toUpdate.amount = Number(data.amount);
    if (data.itemName) {
      toUpdate.languageUsed = isArabicOrUrdu(data.itemName) ? 'urdu' : 'english';
    }
    toUpdate.updatedAt = serverTimestamp(); // As allowed by rules

    await updateDoc(expenseRef, toUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteExpense = async (userId: string, expenseId: string) => {
  const path = `users/${userId}/expenses`;
  const expenseRef = doc(db, path, expenseId);
  try {
    await deleteDoc(expenseRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToExpenses = (userId: string, onData: (expenses: Expense[]) => void) => {
  const path = `users/${userId}/expenses`;
  const q = query(collection(db, path)); // Or orderBy('timestamp', 'desc'), but need index possibly depending on rule

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const expenses: Expense[] = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() } as Expense);
    });
    // sort locally if we don't want to rely on index
    expenses.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return timeB - timeA;
    });
    onData(expenses);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });

  return unsubscribe;
};
