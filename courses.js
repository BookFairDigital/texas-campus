
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

// Logo URLs for known courses. Unavailable logos fall back to text.
const brandLogos = {
  "myob-accounting": {
    name: "MYOB",
    url: "https://cdn.simpleicons.org/myob/7B2D8E"
  },
  "quickbooks-desktop": {
    name: "QuickBooks",
    url: "https://cdn.simpleicons.org/quickbooks/2CA01C"
  },
  "quickbooks-online": {
    name: "QuickBooks",
    url: "https://cdn.simpleicons.org/quickbooks/2CA01C"
  },
  "tally-erp-accounting": {
    name: "Tally ERP",
    url: "https://tallysolutions.com/wp-content/uploads/2023/08/TallyPrime-Logo.png"
  },
  "sage-50-accounting": {
    name: "Sage 50",
    url: "https://cdn.simpleicons.org/sage/00DC82"
  },
  "xero-cloud-accounting": {
    name: "Xero",
    url: "https://cdn.simpleicons.org/xero/13B5EA"
  },
  "zoho-books-cloud": {
    name: "Zoho Books",
    url: "https://www.zoho.com/books/images/zoho-books-logo.svg"
  },
  "freshbooks-accounting": {
    name: "FreshBooks",
    url: "https://cdn.simpleicons.org/freshbooks/0075DD"
  },
  "chatgpt-accounting": {
    name: "ChatGPT",
    url: "https://cdn.simpleicons.org/openai/10A37F"
  },
  "gemini-ai-accounting": {
    name: "Gemini",
    url: "https://cdn.simpleicons.org/googlegemini/4285F4"
  },
  "claude-ai-accounting": {
    name: "Claude",
    url: "https://cdn.simpleicons.org/claude/D97757"
  },
  "gamma-ai-accounting": {
    name: "Gamma",
    url: "https://cdn.simpleicons.org/gamma/8B5CF6"
  }
};

function formatPrice(course) {
  if (course.price === null || course.price === undefined || course.price === "") {
    return "Contact us";
  }

  return `${course.currency || "LKR"} ${Number(course.price).toLocaleString("en-LK")}`;
}

function makeCard(course) {
  const card = document.createElement("article");
  card.className = "catalog-card";
  card.dataset.category = course.category;

  const categoryLabel =
    course.category === "digital"
      ? "Digital Accounting"
      : "AI for Accounting";

  const art = document.createElement("div");
  art.className = course.category === "ai"
    ? "catalog-card-art ai-art-card"
    : "catalog-card-art";

  const logoBox = document.createElement("div");
  logoBox.className = "real-course-logo";

  const brand = brandLogos[course.id] || {
    name: course.name,
    url: null
  };

  if (brand.url) {
    const img = document.createElement("img");
    img.src = brand.url;
    img.alt = `${brand.name} logo`;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";

    img.onerror = () => {
      img.remove();
      logoBox.textContent = brand.name;
      logoBox.classList.add("logo-text-fallback");
    };

    logoBox.appendChild(img);
  } else {
    logoBox.textContent = brand.name;
    logoBox.classList.add("logo-text-fallback");
  }

  art.appendChild(logoBox);

  const content = document.createElement("div");
  content.className = "catalog-card-content";

  const category = document.createElement("span");
  category.className = "course-category-label";
  category.textContent = categoryLabel;

  const title = document.createElement("h3");
  title.textContent = course.name;

  const description = document.createElement("p");
  description.textContent = course.desc;

  const bottom = document.createElement("div");
  bottom.className = "catalog-card-bottom";

  const price = document.createElement("div");
  price.className = "catalog-price";

  const priceText = document.createElement("b");
  priceText.textContent = course.price;
  price.appendChild(priceText);

  const actions = document.createElement("div");
  actions.className = "catalog-actions";

  const slug = encodeURIComponent(course.id);

  const details = document.createElement("a");
  details.className = "small-action details";
  details.href = `course.html?course=${slug}`;
  details.textContent = "View Details";

  const buy = document.createElement("a");
  buy.className = "small-action buy";
  buy.href = `course.html?course=${slug}#buy`;
  buy.textContent = "Buy Now";

  actions.append(details, buy);
  bottom.append(price, actions);
  content.append(category, title, description, bottom);
  card.append(art, content);

  return card;
}

function setFilter(filter) {
  let visible = 0;

  [...grid.children].forEach(card => {
    const show = filter === "all" || card.dataset.category === filter;
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
  if (!grid || !count) {
    console.error("Course grid or results count element is missing.");
    return;
  }

  grid.replaceChildren();
  count.textContent = "Loading courses...";

  const { data, error } = await supabase
    .from("courses")
    .select("slug, title, category, summary, price, currency, is_published, created_at")
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
    desc: course.summary || "Explore this course at Texas Campus.",
    price: formatPrice(course)
  })).filter(course => course.category !== null);

  grid.replaceChildren(...courses.map(makeCard));

  const digitalCount = courses.filter(c => c.category === "digital").length;
  const aiCount = courses.filter(c => c.category === "ai").length;

  const allButton = document.querySelector('.filter-button[data-filter="all"]');
  const digitalButton = document.querySelector('.filter-button[data-filter="digital"]');
  const aiButton = document.querySelector('.filter-button[data-filter="ai"]');

  if (allButton) allButton.innerHTML = `All Courses <span>${courses.length}</span>`;
  if (digitalButton) digitalButton.innerHTML = `Digital Accounting <span>${digitalCount}</span>`;
  if (aiButton) aiButton.innerHTML = `AI for Accounting <span>${aiCount}</span>`;

  setFilter(["digital", "ai"].includes(requestedCategory) ? requestedCategory : "all");
}

const yearElement = document.querySelector("#year");
if (yearElement) yearElement.textContent = new Date().getFullYear();

loadCourses();
