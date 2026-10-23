
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

const brandLogos = {
  myob: { name: "MYOB", url: "./assets/logos/myob.svg" },
  "quickbooks-desktop": { name: "QuickBooks", url: "./assets/logos/quickbooks.svg" },
  "quickbooks-online": { name: "QuickBooks", url: "./assets/logos/quickbooks.svg" },
  tally: { name: "Tally", url: "./assets/logos/tally.svg" },
  sage: { name: "Sage", url: "./assets/logos/sage-50.svg" },
  xero: { name: "Xero", url: "./assets/logos/xero.svg" },
  zoho: { name: "Zoho Books", url: "./assets/logos/zoho-books.svg" },
  freshbooks: { name: "FreshBooks", url: "./assets/logos/freshbooks.svg" },
  chatgpt: { name: "ChatGPT", url: "./assets/logos/chatgpt.svg" },
  gemini: { name: "Gemini", url: "./assets/logos/gemini.svg" },
  claude: { name: "Claude", url: "./assets/logos/claude.svg" },
  gamma: { name: "Gamma", url: "./assets/logos/gamma.svg" }
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

  const art = document.createElement("div");
  art.className = `catalog-card-art ${course.category === "ai" ? "ai-art-card" : ""}`;

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
  category.textContent = course.category === "digital"
    ? "Digital Accounting"
    : "AI for Accounting";

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
  if (!grid || !count) return;

  let visible = 0;

  [...grid.children].forEach(card => {
    const show = filter === "all" || card.dataset.category === filter;
    card.hidden = !show;
    if (show) visible++;
  });

  count.textContent = `Showing ${visible} course${visible === 1 ? "" : "s"}`;

  filterButtons.forEach(button => {
    if (button.classList.contains("filter-button")) {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  });

  document.querySelectorAll(".category-intro").forEach(button => {
    button.classList.toggle("selected", button.dataset.filter === filter);
  });
}

document.querySelectorAll(".filter-button, .category-intro").forEach(button => {
  button.addEventListener("click", () => {
    setFilter(button.dataset.filter);
  });
});

async function loadCourses() {
  if (!grid || !count) {
    console.error("Course catalogue: #catalog-grid or #results-count is missing.");
    return;
  }

  grid.replaceChildren();

  const loading = document.createElement("div");
  loading.className = "empty";
  loading.textContent = "Loading courses...";
  grid.appendChild(loading);
  count.textContent = "Loading courses...";

  try {
    const { data, error } = await supabase
      .from("courses")
      .select("id, slug, title, category, summary, price, currency, is_published, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase course loading error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      grid.replaceChildren();

      const errorCard = document.createElement("div");
      errorCard.className = "empty";
      errorCard.innerHTML = "<strong>Unable to load courses</strong>";

      const errorText = document.createElement("p");
      errorText.textContent = error.message || "Supabase returned an unknown error.";
      errorCard.appendChild(errorText);

      grid.appendChild(errorCard);
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

    const digitalCount = courses.filter(course => course.category === "digital").length;
    const aiCount = courses.filter(course => course.category === "ai").length;

    const allButton = document.querySelector('.filter-button[data-filter="all"]');
    const digitalButton = document.querySelector('.filter-button[data-filter="digital"]');
    const aiButton = document.querySelector('.filter-button[data-filter="ai"]');

    if (allButton) allButton.innerHTML = `All Courses <span>${courses.length}</span>`;
    if (digitalButton) digitalButton.innerHTML = `Digital Accounting <span>${digitalCount}</span>`;
    if (aiButton) aiButton.innerHTML = `AI for Accounting <span>${aiCount}</span>`;

    setFilter(
      ["digital", "ai"].includes(requestedCategory)
        ? requestedCategory
        : "all"
    );

    if (!courses.length) {
      count.textContent = "No published courses found.";
    }

    console.log(`Texas Campus: loaded ${courses.length} published courses.`);
  } catch (error) {
    console.error("Unexpected course catalogue error:", error);

    grid.replaceChildren();

    const errorCard = document.createElement("div");
    errorCard.className = "empty";
    errorCard.textContent =
      "Could not connect to the course service. Check your internet connection and refresh.";
    grid.appendChild(errorCard);

    count.textContent = "Could not load courses. Please refresh.";
  }
}

const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

loadCourses();
