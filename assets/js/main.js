import { db, buildWhatsappOrderLink, buildWhatsappGeneralLink, CONTACT } from "./firebase-config.js";
import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// تحديث كل روابط الواتساب/الفيسبوك العامة في الصفحة
document.querySelectorAll("[data-wa-general]").forEach((el) => {
  el.href = buildWhatsappGeneralLink();
});
document.querySelectorAll("[data-fb-link]").forEach((el) => {
  el.href = CONTACT.facebookUrl;
});

const grid = document.getElementById("products-grid");

function whatsappIconSvg() {
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5 0-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.6 1.5 5.1L2 22l5-1.5c1.4.8 3.1 1.2 5 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.7 0-3.3-.5-4.6-1.3l-.3-.2-3 .9.9-2.9-.2-.3C4 15.2 3.5 13.6 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8.3-8.5 8.3z"/></svg>`;
}

function renderProducts(products) {
  if (!products.length) {
    grid.innerHTML = `<div class="products-empty">المنتجات هتظهر هنا أول ما تُضاف من لوحة التحكم.</div>`;
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const orderLink = buildWhatsappOrderLink(p.name);
      const img = p.imageUrl || "";
      const desc = p.description
        ? `<p class="product-desc">${escapeHtml(p.description)}</p>`
        : "";
      return `
        <article class="product-card">
          <div class="product-photo">
            ${img ? `<img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy">` : ""}
          </div>
          <div class="product-body">
            <h3>${escapeHtml(p.name)}</h3>
            ${desc}
            <a class="product-order-btn" href="${orderLink}" target="_blank" rel="noopener">
              ${whatsappIconSvg()}
              اطلب الآن
            </a>
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

if (grid) {
  grid.innerHTML = `<div class="products-loading">جاري تحميل المنتجات…</div>`;
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    onSnapshot(
      q,
      (snap) => {
        const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderProducts(products);
      },
      (err) => {
        console.error(err);
        grid.innerHTML = `<div class="products-empty">تعذر تحميل المنتجات حاليًا، حاول تاني بعد شوية.</div>`;
      }
    );
  } catch (e) {
    console.error(e);
  }
}

// قائمة الموبايل
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}
