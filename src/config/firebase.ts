import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import { getStorage } from 'firebase-admin/storage';

dotenv.config();

// Xử lý lỗi xuống dòng của Private Key khi đọc từ .env
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  console.error('Thiếu cấu hình Firebase trong file .env');
} else {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Init Error:', error);
  }
}

export const firebaseStorage = getStorage().bucket();
export const firebaseAuth = admin.auth();
export const firebaseMessaging = admin.messaging(); // Dùng cho thông báo đẩy sau này