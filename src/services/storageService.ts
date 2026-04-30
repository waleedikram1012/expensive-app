import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

export const uploadReceipt = async (userId: string, file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const filePath = `users/${userId}/receipts/${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};
