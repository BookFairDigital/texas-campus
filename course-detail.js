
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (selector) => document.querySelector(selector);

const params = new URLSearchParams(window.location.search);
const slug = params.get("course");

const checkoutDialog = $("#checkout-dialog");
const registerStep = $("#checkout-step-register");
const paymentStep = $("#checkout-step-payment");
const doneStep = $("#checkout-step-done");

let course = null;
let checkoutStudent = null;

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value ?? "";
}

function money(price, currency = "LKR") {
  if (price === null || price === undefined || price === "") {
    return "Contact us";
  }

  return `${currency} ${Number(price).toLocaleString("en-LK")}`;
}

function showError(message) {
  setText("#detail-title", message);
  setText("#detail-description", "Please return to the courses page and try again.");
  setText("#detail-overview", message);
  setText("#purchase-name", "Course unavailable");
  setText("#purchase-price", "—");

  const buyButton = $("#buy-button");
  if (buyButton) buyButton.disabled = true;
}

async function loadCourse() {
  if (!slug) {
    showError("No course was selected.");
    return;
  }

  const { data, error } = await supabase
    .from("courses")
    .select("slug, title, category, summary, price, currency, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Course loading error:", error);
    showError("Unable to load this course.");
    return;
  }

  if (!data) {
    showError("This course is unavailable or has not been published.");
    return;
  }

  course = {
    slug: data.slug,
    name: data.title,
    category: data.category === "digital_accounting"
      ? "Digital Accounting"
      : data.category === "ai_accounting"
        ? "Artificial Intelligence for Accounting"
        : data.category,
    desc: data.summary || "Explore this course at Texas Campus.",
    overview: data.summary || "Course information will be updated soon.",
    price: money(data.price, data.currency || "LKR")
  };

  document.title = `${course.name} | Texas Campus`;

  setText("#breadcrumb-title", course.name);
  setText("#detail-category", String(course.category).toUpperCase());
  setText("#detail-title", course.name);
  setText("#detail-description", course.desc);
  setText("#detail-overview", course.overview);
  setText("#detail-mark", "✦");
  setText("#purchase-name", course.name);
  setText("#purchase-price", course.price);
  setText("#checkout-course-name", course.name);
  setText("#checkout-course-price", course.price);
  setText("#purchase-note", "Continue to registration and bank deposit instructions.");
}

function openCheckout() {
  if (!course || !checkoutDialog) {
    console.error("Course or checkout dialog missing");
    return;
  }

  registerStep.hidden = false;
  paymentStep.hidden = true;
  doneStep.hidden = true;

  if (typeof checkoutDialog.showModal === "function") {
    checkoutDialog.showModal();
  } else {
    checkoutDialog.setAttribute("open", "");
  }
}

$("#buy-button")?.addEventListener("click", openCheckout);

$(".checkout-close")?.addEventListener("click", () => {
  checkoutDialog?.close();
});

checkoutDialog?.addEventListener("click", (event) => {
  if (event.target === checkoutDialog) checkoutDialog.close();
});

$("#student-checkout-form")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);

  checkoutStudent = {
    fullName: String(form.get("fullName") || "").trim(),
    username: String(form.get("username") || "").trim(),
    email: String(form.get("email") || "").trim(),
    mobile: String(form.get("mobile") || "").trim()
  };

  // Do not store the password in frontend JavaScript.
  setText("#checkout-course-name", course.name);
  setText("#checkout-course-price", course.price);

  registerStep.hidden = true;
  paymentStep.hidden = false;
  doneStep.hidden = true;
});

$("#demo-order-form")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);

  const summary = $("#demo-order-summary");
  summary.replaceChildren();

  const details = [
    ["Course", course?.name || ""],
    ["Price", course?.price || ""],
    ["Student", checkoutStudent?.fullName || ""],
    ["Email", checkoutStudent?.email || ""],
    ["Deposit reference", String(form.get("reference") || "").trim()],
    ["Status", "Demo only — no order submitted"]
  ];

  details.forEach(([label, value]) => {
    const row = document.createElement("p");
    const key = document.createElement("span");
    const val = document.createElement("b");

    key.textContent = `${label}: `;
    val.textContent = value;

    row.append(key, val);
    summary.appendChild(row);
  });

  paymentStep.hidden = true;
  doneStep.hidden = false;
});

$("#finish-demo-order")?.addEventListener("click", () => {
  checkoutDialog?.close();
});

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

loadCourse();
