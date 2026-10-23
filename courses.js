
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const grid = document.querySelector("#catalog-grid");
const count = document.querySelector("#results-count");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

let courses = [];

const params = new URLSearchParams(window.location.search);
const requestedCategory = params.get("category");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatPrice(course) {
  if (course.price == null || course.price === "") {
    return "Contact us";
  }

  const currency = course.currency || "LKR";
  return `${currency} ${Number(course.price).toLocaleString("en-LK")}`;
}

function makeCard(course) {
  const card = document.createElement("article");
  card.className = "catalog-card";
  card.dataset.category = course.category;

  const categoryLabel =
    course.category === "digital"
      ? "Digital Accounting"
      : "AI for Accounting";

  const artClass =
    course.category === "ai"
      ? "catalog-card-art ai-art-card"
      : "catalog-card-art";

  const name = escapeHTML(course.name);
  const description = escapeHTML(course.desc);
  const mark = escapeHTML(course.mark);
  const tone = escapeHTML(course.tone);
  const price = escapeHTML(course.price);
  const slug = encodeURIComponent(course.id);

  card.innerHTML = `
    <div class="${artClass}">
      <div class="course-laptop" aria-label="${name} logo on a laptop screen">
        <div class="laptop-screen">
          <div class="screen-brand ${tone}">
            <span class="screen-mark">${mark}</span>
            <span class="screen-name">${name}</span>
          </div>
          <div class="screen-glint"></div>
        </div>
        <div class="laptop-base"></div>
      </div>
    </div>

    <div class="catalog-card-content">
      <span class="course-category-label">${categoryLabel}</span>
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="catalog-card-bottom">
        <div class="catalog-price"><b>${price}</b></div>
        <div class="catalog-actions">
          <a class="small-action details"
             href="course.html?course=${slug}">View Details</a>
          <a class="small-action buy"
             href="course.html?course=${slug}#buy">Buy Now</a>
        </div>
      </div>
    </div>
  `;

  return card;
}

function setFilter(filter) {
  let visible = 0;

  [...grid.children].forEach(card => {
    const show =
      filter === "all" || card.dataset.category === filter;

    card.hidden = !show;
    if (show) visible++;
  });

  count.textContent =
    `Showing ${visible} course${visible === 1 ? "" : "s"}`;

  filterButtons.forEach(button => {
    const active = button.dataset.filter === filter;

    if (button.classList.contains("filter-button")) {
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  });

  document.querySelectorAll(".category-intro").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.filter === filter
    );
  });
}

document.querySelectorAll(".filter-button, .category-intro")
  .forEach(button => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
    });
  });

async function loadCourses() {
  grid.replaceChildren();
  count.textContent = "Loading courses...";

  const { data, error } = await supabase
    .from("courses")
    .select(
      "slug, title, category, summary, price, currency, is_published, created_at"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase course loading error:", error);
    count.textContent = "Could not load courses. Please refresh.";
    return;
  }

  courses = (data || []).map(course => ({
    id: course.slug,
    name: course.title,
    category:
      course.category === "digital_accounting"
        ? "digital"
        : course.category === "ai_accounting"
          ? "ai"
          : null,
    mark:
      course.category === "digital_accounting" ? "TC" : "✦",
    tone:
      course.category === "digital_accounting" ? "purple" : "blue",
    desc: course.summary || "Explore this course at Texas Campus.",
    price: formatPrice(course)
  })).filter(course => course.category !== null);

  grid.replaceChildren(...courses.map(makeCard));

  const digitalCount = courses.filter(
    course => course.category === "digital"
  ).length;

  const aiCount = courses.filter(
    course => course.category === "ai"
  ).length;

  const allButton = document.querySelector(
    '.filter-button[data-filter="all"]'
  );
  const digitalButton = document.querySelector(
    '.filter-button[data-filter="digital"]'
  );
  const aiButton = document.querySelector(
    '.filter-button[data-filter="ai"]'
  );

  if (allButton) {
    allButton.innerHTML =
      `All Courses <span>${courses.length}</span>`;
  }

  if (digitalButton) {
    digitalButton.innerHTML =
      `Digital Accounting <span>${digitalCount}</span>`;
  }

  if (aiButton) {
    aiButton.innerHTML =
      `AI for Accounting <span>${aiCount}</span>`;
  }

  const initialFilter =
    ["digital", "ai"].includes(requestedCategory)
      ? requestedCategory
      : "all";

  setFilter(initialFilter);
}

const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

loadCourses();
