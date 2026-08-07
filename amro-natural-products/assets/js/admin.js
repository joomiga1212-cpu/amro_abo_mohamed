import { db } from "./firebase-config.js";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* -------------------- رفع الصور (ImgBB مجانًا بدون بطاقة) -------------------- */
// سجّل حساب مجاني على https://api.imgbb.com/ وحط مفتاح الـ API هنا بدل النص ده
const IMGBB_API_KEY = "c09abfdd90c1b39fd719e7ae52f07dbd";

/* -------------------- الدخول بكلمة سر بسيطة -------------------- */
const ADMIN_PASSWORD = "1282009";
const SESSION_KEY = "amro_admin_session";

const loginScreen = document.getElementById("login-screen");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

function showDashboard() {
  loginScreen.classList.remove("show-flex");
  adminApp.classList.add("show");
}
function showLogin() {
  adminApp.classList.remove("show");
  loginScreen.classList.add("show-flex");
}

if (sessionStorage.getItem(SESSION_KEY) === "true") {
  showDashboard();
} else {
  showLogin();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.classList.remove("show");
  const password = document.getElementById("login-password").value;

  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "true");
    loginForm.reset();
    showDashboard();
  } else {
    loginError.textContent = "كلمة المرور غير صحيحة، حاول تاني.";
    loginError.classList.add("show");
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});

const productForm = document.getElementById("product-form");
const nameInput = document.getElementById("product-name");
const descriptionInput = document.getElementById("product-description");
const imageInput = document.getElementById("product-image");
const imageDrop = document.getElementById("image-drop");
const imagePreview = document.getElementById("image-preview");
const progressBar = document.getElementById("upload-progress");
const progressInner = progressBar.querySelector("span");
const formSuccess = document.getElementById("form-success");
const submitBtn = document.getElementById("submit-btn");

const productsList = document.getElementById("admin-products-list");

/* -------------------- معاينة الصورة -------------------- */
let selectedFile = null;
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

/* -------------------- إضافة منتج -------------------- */
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formSuccess.classList.remove("show");

  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!name) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "جاري الإضافة…";

  try {
    let imageUrl = "";
    if (selectedFile) {
      imageUrl = await uploadImage(selectedFile);
    }

    await addDoc(collection(db, "products"), {
      name,
      description,
      imageUrl,
      createdAt: serverTimestamp()
    });

    productForm.reset();
    imagePreview.style.display = "none";
    selectedFile = null;
    progressBar.classList.remove("show");
    progressInner.style.width = "0%";
    formSuccess.textContent = "تمت إضافة المنتج بنجاح ✅";
    formSuccess.classList.add("show");
  } catch (err) {
    console.error(err);
    formSuccess.textContent = "حصل خطأ أثناء الإضافة، حاول تاني.";
    formSuccess.style.color = "#8C3B2E";
    formSuccess.classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "إضافة المنتج";
  }
});

function uploadImage(file, barEl = progressBar, innerEl = progressInner) {
  return new Promise((resolve, reject) => {
    if (!IMGBB_API_KEY || IMGBB_API_KEY === "ضع_مفتاح_ImgBB_هنا") {
      reject(new Error("لازم تحط مفتاح ImgBB الأول في ملف admin.js"));
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`);
    barEl.classList.add("show");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = (e.loaded / e.total) * 100;
        innerEl.style.width = `${pct}%`;
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          resolve(data.data.url);
        } else {
          reject(new Error(data.error?.message || "فشل رفع الصورة"));
        }
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("فشل الاتصال أثناء رفع الصورة"));
    xhr.send(formData);
  });
}

/* -------------------- عرض/حذف/تعديل المنتجات -------------------- */
let productsCache = {};

const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(q, (snap) => {
  if (snap.empty) {
    productsCache = {};
    productsList.innerHTML = `<div class="empty-state">لسه مفيش منتجات مضافة.</div>`;
    return;
  }
  productsCache = {};
  productsList.innerHTML = snap.docs
    .map((d) => {
      const p = d.data();
      productsCache[d.id] = p;
      return `
        <div class="product-row">
          <img src="${p.imageUrl || ''}" alt="${escapeHtml(p.name)}">
          <div>
            <div class="name">${escapeHtml(p.name)}</div>
          </div>
          <div class="actions">
            <button class="btn btn-edit btn-sm" data-edit="${d.id}">تعديل</button>
            <button class="btn btn-danger btn-sm" data-delete="${d.id}">حذف</button>
          </div>
        </div>
      `;
    })
    .join("");
});

productsList.addEventListener("click", async (e) => {
  const editBtn = e.target.closest("[data-edit]");
  if (editBtn) {
    openEditModal(editBtn.dataset.edit);
    return;
  }

  const btn = e.target.closest("[data-delete]");
  if (!btn) return;
  if (!confirm("متأكد إنك عايز تحذف المنتج ده؟")) return;

  const id = btn.dataset.delete;
  btn.disabled = true;
  btn.textContent = "جاري الحذف…";

  try {
    await deleteDoc(doc(db, "products", id));
  } catch (err) {
    console.error(err);
    alert("حصل خطأ أثناء الحذف.");
    btn.disabled = false;
    btn.textContent = "حذف";
  }
});

/* -------------------- نافذة تعديل المنتج -------------------- */
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const editNameInput = document.getElementById("edit-name");
const editDescriptionInput = document.getElementById("edit-description");
const editImageInput = document.getElementById("edit-image");
const editImagePreview = document.getElementById("edit-image-preview");
const editProgressBar = document.getElementById("edit-upload-progress");
const editProgressInner = editProgressBar.querySelector("span");
const editFormSuccess = document.getElementById("edit-form-success");
const editSubmitBtn = document.getElementById("edit-submit-btn");
const editCancelBtn = document.getElementById("edit-cancel-btn");

let editingId = null;
let editSelectedFile = null;

function openEditModal(id) {
  const p = productsCache[id];
  if (!p) return;

  editingId = id;
  editSelectedFile = null;
  editImageInput.value = "";
  editNameInput.value = p.name || "";
  editDescriptionInput.value = p.description || "";

  if (p.imageUrl) {
    editImagePreview.src = p.imageUrl;
    editImagePreview.style.display = "block";
  } else {
    editImagePreview.style.display = "none";
    editImagePreview.src = "";
  }

  editProgressBar.classList.remove("show");
  editProgressInner.style.width = "0%";
  editFormSuccess.classList.remove("show");
  editModal.classList.add("show");
}

function closeEditModal() {
  editModal.classList.remove("show");
  editingId = null;
}

editCancelBtn.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

editImageInput.addEventListener("change", () => {
  const file = editImageInput.files[0];
  if (!file) return;
  editSelectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    editImagePreview.src = e.target.result;
    editImagePreview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!editingId) return;

  const name = editNameInput.value.trim();
  const description = editDescriptionInput.value.trim();
  if (!name) return;

  editSubmitBtn.disabled = true;
  editSubmitBtn.textContent = "جاري الحفظ…";

  try {
    const updateData = { name, description };
    if (editSelectedFile) {
      updateData.imageUrl = await uploadImage(editSelectedFile, editProgressBar, editProgressInner);
    }

    await updateDoc(doc(db, "products", editingId), updateData);

    editFormSuccess.style.color = "";
    editFormSuccess.textContent = "تم حفظ التعديلات بنجاح ✅";
    editFormSuccess.classList.add("show");
    setTimeout(closeEditModal, 900);
  } catch (err) {
    console.error(err);
    editFormSuccess.style.color = "#8C3B2E";
    editFormSuccess.textContent = "حصل خطأ أثناء الحفظ، حاول تاني.";
    editFormSuccess.classList.add("show");
  } finally {
    editSubmitBtn.disabled = false;
    editSubmitBtn.textContent = "حفظ التعديلات";
  }
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
