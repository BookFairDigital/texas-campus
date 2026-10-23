
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dykxmozruyzgkiyopvlp.supabase.co";
const SUPABASE_KEY = "sb_publishable_WprXMzuhLjAKfZfGHvM48A_OHGjmaVH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

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
const registrationForm = $("#student-checkout-form");

let selectedCourse = null;
let submitting = false;

function showMessage(message) {
  const note = $("#purchase-note");
  if (note) {
    note.textContent = message;
    note.style.color = "#df1732";
  } else {
    console.info(message);
  }
}

function showStep(step) {
  if (registerStep) registerStep.hidden = step !== "register";
  if (paymentStep) paymentStep.hidden = step !== "payment";
  if (doneStep) doneStep.hidden = step !== "done";
}

function openDialog() {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
}

function closeDialog() {
  if (!dialog) return;
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

function formatPrice(course) {
  if (course.price === null || course.price === undefined || course.price === "") {
    return "Contact us";
  }
  return `${course.currency || "LKR"} ${Number(course.price).toLocaleString("en-LK")}`;
}

async function loadCourse() {
  if (!requestedSlug) {
    showMessage("Course eka catalogue eken select karala aye try karanna.");
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
    showMessage("Me course eka available naha nathnam publish karala naha.");
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

  setText(
    "#detail-category",
    data.category === "ai_accounting"
      ? "ARTIFICIAL INTELLIGENCE FOR ACCOUNTING"
      : "DIGITAL ACCOUNTING"
  );

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
  if (error) throw new Error("Login session check failed: " + error.message);
  return data.session?.user || null;
}

async function getStudentProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,username,email,mobile,account_status,access_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error("Student profile load failed: " + error.message);
  return data;
}

async function startCheckout() {
  if (!selectedCourse) {
    showMessage("Course details load wena thuru wait karanna.");
    return;
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      const intro = $(".checkout-intro", registerStep || document);
      if (intro) {
        intro.innerHTML =
          'Course purchase karanna student account ekak one. ' +
          '<a href="./index.html#student-login">Existing student? Log in here</a>. ' +
          'New student kenek nam pahala account form eka fill karanna.';
      }

      showStep("register");
      openDialog();
      return;
    }

    const profile = await getStudentProfile(user);

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
    if (depositor && profile.full_name) depositor.value = profile.full_name;

    const intro = $("#checkout-step-payment .checkout-intro");
    if (intro) {
      intro.innerHTML =
        "Course: <strong>" + escapeHTML(selectedCourse.title) +
        "</strong><br>Student: <strong>" +
        escapeHTML(profile.full_name || profile.username || user.email || "Student") +
        "</strong>";
    }

    setText("#checkout-course-name", selectedCourse.title);
    setText("#checkout-course-price", formatPrice(selectedCourse));
    showStep("payment");
    openDialog();
  } catch (error) {
    console.error("Checkout start error:", error);
    showMessage(error.message || "Checkout start karanna bari una.");
  }
}

async function registerStudent(event) {
  event.preventDefault();
  if (submitting) return;

  const form = event.currentTarget;
  const getValue = (...names) => {
    for (const name of names) {
      const field = form.elements.namedItem(name);
      if (field && String(field.value || "").trim()) {
        return String(field.value).trim();
      }
    }
    return "";
  };

  const fullName = getValue("full_name", "name", "fullName");
  const username = getValue("username");
  const email = getValue("email");
  const mobile = getValue("mobile", "phone");
  const passwordField = form.elements.namedItem("password");
  const password = String(passwordField?.value || "");

  if (!fullName || !username || !email || !mobile || !password) {
    alert("Full name, username, email, mobile saha password okkoma fill karanna.");
    return;
  }

  if (password.length < 8) {
    alert("Password eka at least characters 8k wenna one.");
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  submitting = true;
  if (button) {
    button.disabled = true;
    button.textContent = "Creating account...";
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          mobile
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Account eka create une naha.");

    if (!data.session) {
      alert(
        "Account request eka create una. Email confirmation required nam email eka confirm karala student login wenna. Eeta passe course eka purchase karanna."
      );
      window.location.href = "./index.html#student-login";
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        username,
        email,
        mobile,
        account_status: "active"
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile save error:", profileError);
      throw new Error(
        "Account eka create una, namuth student profile eka save karanna bari una. Admin ta contact karanna. " +
        profileError.message
      );
    }

    alert("Account eka haduna! Dan course checkout eka continue karanna.");
    await startCheckout();
  } catch (error) {
    console.error("Student registration failed:", error);
    alert("Account create karanna bari una: " + (error.message || "Unknown error"));
  } finally {
    submitting = false;
    if (button) {
      button.disabled = false;
      button.textContent = "Create Student Account";
    }
  }
}

async function submitOrder(event) {
  event.preventDefault();
  if (submitting) return;

  if (!selectedCourse) {
    alert("Course eka load wela naha. Refresh karala try karanna.");
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
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.textContent = "Submitting order...";
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Student login session eka naha. Login wela aye try karanna.");

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,slug,title,price,currency,is_published")
      .eq("id", selectedCourse.id)
      .eq("is_published", true)
      .maybeSingle();

    if (courseError) throw courseError;
    if (!course) throw new Error("Course eka dan available naha.");
    if (course.price === null || Number(course.price) < 0) {
      throw new Error("Me course eke valid price ekak set karala naha.");
    }

    const profile = await getStudentProfile(user);
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
      .limit(10);

    if (existingError) throw existingError;

    if (existingOrders?.some(order =>
      order.payment_status === "approved" && order.course_access === true
    )) {
      throw new Error("Oya me course ekata already access thiyenawa. Dashboard eka check karanna.");
    }

    if (existingOrders?.some(order => order.payment_status === "pending")) {
      throw new Error("Me course ekata pending order ekak thiyenawa. Admin review eka iwara wenakan wait karanna.");
    }

    const { data: order, error: orderError } = await supabase
      .from("course_orders")
      .insert({
        student_id: user.id,
        course_id: course.id,
        amount: Number(course.price),
        currency: course.currency || "LKR",
        payment_method: "bank_deposit",
        payment_reference: reference,
        payment_status: "pending",
        course_access: false,
        admin_note: `Depositor name: ${depositor}`
      })
      .select("id,payment_status,course_access,amount,currency,created_at")
      .single();

    if (orderError) {
      throw new Error(
        orderError.code === "42501"
          ? "Database permission denied. course_orders INSERT RLS policy eka check karanna."
          : orderError.message
      );
    }

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
        "Order eka save una. Admin payment eka verify karala approve karana thuru course access unlock wenne naha.";
    }

    showStep("done");
    form.reset();
  } catch (error) {
    console.error("Checkout submission failed:", error);
    alert("Order submit karanna bari una: " + (error.message || "Unknown error"));
  } finally {
    submitting = false;
    if (button) {
      button.disabled = false;
      button.textContent = "Submit Bank Deposit Details →";
    }
  }
}

if (buyButton) buyButton.addEventListener("click", startCheckout);
if (closeButton) closeButton.addEventListener("click", closeDialog);
if (finishButton) finishButton.addEventListener("click", closeDialog);

if (dialog) {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog();
  });
}

if (registrationForm) {
  registrationForm.addEventListener("submit", registerStudent);

  const passwordInput = registrationForm.elements.namedItem("password");
  if (passwordInput) {
    passwordInput.autocomplete = "new-password";
    passwordInput.minLength = 8;
  }
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", submitOrder);

  const receiptInput = checkoutForm.elements.namedItem("receipt");
  if (receiptInput) {
    const receiptLabel = receiptInput.closest("label");
    if (receiptLabel) receiptLabel.hidden = true;
  }
}

const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

loadCourse();
