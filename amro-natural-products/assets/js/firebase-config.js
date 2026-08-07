// إعدادات فايربيز الخاصة بمشروع "عمرو أبو محمد للمنتجات الطبيعية"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKeDRG75HNWyjQzYiz97wXj7mEUjSSGrI",
  authDomain: "amro-2b1d2.firebaseapp.com",
  databaseURL: "https://amro-2b1d2-default-rtdb.firebaseio.com",
  projectId: "amro-2b1d2",
  storageBucket: "amro-2b1d2.firebasestorage.app",
  messagingSenderId: "463015653752",
  appId: "1:463015653752:web:bd5649a0e3571d2b63d88d",
  measurementId: "G-L5JTN4CCQ5"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// بيانات التواصل الأساسية للموقع كله (رقم الواتساب وصفحة الفيسبوك)
export const CONTACT = {
  whatsappNumber: "201024002498", // بصيغة دولية بدون + أو أصفار
  facebookUrl: "https://www.facebook.com/share/1E9X8r4DH1/"
};

export function buildWhatsappOrderLink(productName) {
  const text = `السلام عليكم، عايز أطلب: ${productName}`;
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsappGeneralLink() {
  const text = "السلام عليكم، عندي استفسار عن منتجاتكم الطبيعية";
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
