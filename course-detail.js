
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(window.location.search);
const requestedSlug = params.get("course");

const dialog = $("#checkout-dialog");
const registerStep = $("#checkout-step-register");
const paymentStep = $("#checkout-step-payment");
const doneStep = $("#checkout-step-done");
const buyButton = $("#buy-button");
const closeButton = $(".checkout-close");
const finishButton = $("#finish-demo-order");
const checkoutForm = $("#demo-order-form");

let selectedCourse = null;
let signedInUser = null;
let submitting = false;

function showMessage(message) {
  const note = $("#purchase-note");
  if (note) {
    note.textContent = message;
    note.style.color = "#df1732";
  }
}

function resetDialog() {
  registerStep.hidden = true;
  paymentStep.hidden = false;
  doneStep.hidden = true;
}

function formatPrice(course) {
  if (course.price === null || course.price === undefined || course.price === "") {
    return "Contact us";
  }

  return `${course.currency || "LKR"} ${Number(course.price).toLocaleString("en-LK")}`;
}

function showStep(step) {
  registerStep.hidden = step !== "register";
  paymentStep.hidden = step !== "payment";
  doneStep.hidden = step !== "done";
}

function openDialog() {
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog() {
  if (typeof dialog.close === "function" && dialog.open) {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

async function loadCourse() {
  if (!requestedSlug) {
    showMessage("Course slug eka URL eke naha. Course catalogue eken course eka select karanna.");
    if (buyButton) buyButton.disabled = true;
    return;
  }

  const { data, error } = await supabase
    .from("courses")
    .select("id,slug,title,category,summary,price,currency,is_published,drive_folder_url")
    .eq("slug", requestedSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Course lookup failed:", error);
    showMessage("Course load karanna bari una: " + error.message);
    if (buyButton) buyButton.disabled = true;
    return;
  }

  if (!data) {
    showMessage("Me course eka available naha, nathnam publish karala naha.");
    if (buyButton) buyButton.disabled = true;
    return;
  }

  selectedCourse = data;

  setText("#detail-title", data.title);
  setText("#breadcrumb-title", data.title);
  setText("#detail-description", data.summary || "Explore this course at Texas Campus.");
  setText("#detail-overview", data.summary || "Explore this course at Texas Campus.");
  setText("#purchase-name", data.title);
  setText("#purchase-price", formatPrice(data));
  setText("#checkout-course-name", data.title);
  setText("#checkout-course-price", formatPrice(data));

  const categoryLabel = data.category === "ai_accounting"
    ? "ARTIFICIAL INTELLIGENCE FOR ACCOUNTING"
    : "DIGITAL ACCOUNTING";

  setText("#detail-category", categoryLabel);

  const mark = $("#detail-mark");
  if (mark) {
    const marks = {
      myob: "M",
      sage: "S",
      tally: "T",
      xero: "X",
      zoho: "Z",
      claude: "C",
      chatgpt: "✳",
      gemini: "✦",
      gamma: "G"
    };
    mark.textContent = marks[data.slug] || "✦";
  }

  if (buyButton) buyButton.disabled = false;
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Login session check failed: " + error.message);
  }

  if (!data.session?.user) return null;

  return data.session.user;
}

async function startCheckout() {
  if (!selectedCourse) {
    showMessage("Course details load wena thuru wait karanna.");
    return;
  }

  try {
    signedInUser = await getCurrentUser();
  } catch (error) {
    showMessage(error.message);
    return;
  }

  if (!signedInUser) {
    const note = $("#checkout-step-register .checkout-intro");
    if (note) {
      note.innerHTML =
        'Course order ekak submit karanna student account eken login wenna one. ' +
        '<a href="./index.html#student-login">Student Log In</a>';
    }

    showStep("register");
    openDialog();
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,username,email,mobile,account_status")
    .eq("id", signedInUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Student profile lookup failed:", profileError);
    showMessage("Student profile eka load karanna bari una: " + profileError.message);
    return;
  }

  if (!profile) {
    showMessage("Student profile eka hambune naha. Admin ta contact karanna.");
    return;
  }

  if (profile.account_status && profile.account_status !== "active") {
    showMessage("Student account eka active naha. Admin ta contact karanna.");
    return;
  }

  if (
    profile.access_expires_at &&
    new Date(profile.access_expires_at).getTime() < Date.now()
  ) {
    showMessage("Student account access eka expire wela. Admin ta contact karanna.");
    return;
  }

  const depositor = checkoutForm?.elements.namedItem("depositor");
  if (depositor && profile.full_name) {
    depositor.value = profile.full_name;
  }

  setText("#checkout-course-name", selectedCourse.title);
  setText("#checkout-course-price", formatPrice(selectedCourse));

  const intro = $("#checkout-step-payment .checkout-intro");
  if (intro) {
    intro.innerHTML =
      "Course: <strong>" + escapeHTML(selectedCourse.title) +
      "</strong><br>Student: <strong>" +
      escapeHTML(profile.full_name || profile.username || signedInUser.email || "Student") +
      "</strong>";
  }

  showStep("payment");
  openDialog();
}

async function submitOrder(event) {
  event.preventDefault();

  if (submitting) return;

  if (!selectedCourse) {
    alert("Course details are not available. Please refresh and try again.");
    return;
  }

  const form = event.currentTarget;
  const depositor = String(form.elements.namedItem("depositor")?.value || "").trim();
  const reference = String(form.elements.namedItem("reference")?.value || "").trim();

  if (!depositor || !reference) {
    alert("Depositor name saha deposit reference dekama enter karanna.");
    return;
  }

  submitting = true;

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting order...";
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Login session eka expire wela. Login wela aye try karanna.");
    }

    // Re-read the course from Supabase; do not trust the price in the browser.
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,slug,title,price,currency,is_published")
      .eq("id", selectedCourse.id)
      .eq("is_published", true)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course) throw new Error("Course eka dan available naha.");

    if (course.price === null || course.price === undefined || Number(course.price) < 0) {
      throw new Error("Me course eke valid price ekak set karala naha. Admin ta contact karanna.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_status,access_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error("Student profile eka hambune naha.");

    if (profile.account_status && profile.account_status !== "active") {
      throw new Error("Student account eka active naha.");
    }

    if (
      profile.access_expires_at &&
      new Date(profile.access_expires_at).getTime() < Date.now()
    ) {
      throw new Error("Student account access eka expire wela.");
    }

    const { data: existingOrders, error: existingError } = await supabase
      .from("course_orders")
      .select("id,payment_status,course_access")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .in("payment_status", ["pending", "approved"])
      .limit(1);

    if (existingError) throw existingError;

    if (existingOrders?.some(order => order.payment_status === "approved" && order.course_access === true)) {
      throw new Error("Oya me course ekata already access thiyenawa. Student dashboard eka check karanna.");
    }

    if (existingOrders?.some(order => order.payment_status === "pending")) {
      throw new Error("Me course ekata pending order ekak danatama thiyenawa. Admin payment review eka complete karana thuru wait karanna.");
    }

    const orderRecord = {
      student_id: user.id,
      course_id: course.id,
      amount: Number(course.price),
      currency: course.currency || "LKR",
      payment_method: "bank_deposit",
      payment_reference: reference,
      payment_status: "pending",
      course_access: false,
      admin_note: `Depositor name: ${depositor}`
    };

    const { data: order, error: orderError } = await supabase
      .from("course_orders")
      .insert(orderRecord)
      .select("id,payment_status,course_access,amount,currency,created_at")
      .single();

    if (orderError) {
      console.error("Order submission failed:", orderError);
      throw new Error(
        orderError.code === "42501"
          ? "Database permission denied. course_orders INSERT RLS policy eka check karanna."
          : orderError.message || "Order eka save karanna bari una."
      );
    }

    setText("#checkout-course-name", course.title);
    setText("#checkout-course-price", formatPrice(course));

    const summary = $("#demo-order-summary");
    if (summary) {
      summary.innerHTML = `
        <p><span>Course:</span><b>${escapeHTML(course.title)}</b></p>
        <p><span>Amount:</span><b>${escapeHTML(formatPrice(course))}</b></p>
        <p><span>Deposit reference:</span><b>${escapeHTML(reference)}</b></p>
        <p><span>Order ID:</span><b>${escapeHTML(order.id)}</b></p>
        <p><span>Status:</span><b>Pending admin review</b></p>
        <p><span>Course access:</span><b>Locked until payment approval</b></p>
      `;
    }

    const doneText = $("#checkout-step-done > p");
    if (doneText) {
      doneText.textContent =
        "Order eka Supabase ekata save una. Payment eka admin verify karala approve karana thuru course access unlock wenne naha.";
    }

    showStep("done");
    form.reset();
  } catch (error) {
    console.error("Checkout submission failed:", error);
    alert("Order submit karanna bari una: " + (error.message || "Unknown error"));
  } finally {
    submitting = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = 'Submit Bank Deposit Details <span>→</span>';
    }
  }
}

if (buyButton) {
  buyButton.addEventListener("click", startCheckout);
}

if (closeButton) {
  closeButton.addEventListener("click", closeDialog);
}

if (finishButton) {
  finishButton.addEventListener("click", closeDialog);
}

if (dialog) {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", submitOrder);

  // A receipt upload is not implemented until a private Storage bucket is configured.
  const receiptInput = checkoutForm.elements.namedItem("receipt");
  if (receiptInput) {
    const receiptLabel = receiptInput.closest("label");
    if (receiptLabel) receiptLabel.hidden = true;
  }
}

// Prevent the old prototype registration form from collecting passwords.
const registrationForm = $("#student-checkout-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", event => {
    event.preventDefault();
    alert("Aluth account hadanna checkout form eka use karanna epa. Student account eka hadaganna/admin ta contact karanna, passe login wela purchase karanna.");
  });

  const passwordInput = registrationForm.elements.namedItem("password");
  if (passwordInput) {
    const passwordLabel = passwordInput.closest("label");
    if (passwordLabel) passwordLabel.hidden = true;
  }
}

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

loadCourse();
