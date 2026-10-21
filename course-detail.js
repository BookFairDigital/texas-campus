const courseData = {
  "myob-accounting": {name:"MYOB Accounting",category:"Digital Accounting",mark:"myob",desc:"Learn MYOB accounting workflows, from core bookkeeping to practical business reporting.",overview:"Build familiarity with MYOB concepts and common accounting workflows through guided lessons and practical examples.",price:"LKR 12,500"},
  "quickbooks-desktop": {name:"QuickBooks Desktop",category:"Digital Accounting",mark:"qb",desc:"Build confidence using QuickBooks Desktop for everyday accounting tasks and small-business workflows.",overview:"Explore company setup concepts, transaction entry, routine bookkeeping and reporting workflows.",price:"LKR 12,500"},
  "quickbooks-online": {name:"QuickBooks Online",category:"Digital Accounting",mark:"qb",desc:"Learn cloud accounting, transactions, reports and day-to-day workflows using QuickBooks Online.",overview:"Understand cloud bookkeeping concepts, common transaction workflows and how reports support business decisions.",price:"LKR 12,500"},
  "tally-erp-accounting": {name:"Tally ERP Accounting",category:"Digital Accounting",mark:"T",desc:"Learn practical accounting entries, ledgers and business reporting with Tally ERP.",overview:"Build a practical foundation in ledger concepts, transaction entry and financial reporting workflows.",price:"LKR 12,500"},
  "sage-50-accounting": {name:"Sage 50 Accounting",category:"Digital Accounting",mark:"sage",desc:"Build a foundation in desktop accounting, records and reports using Sage 50.",overview:"Learn core Sage 50 workflows for accounting records, common transactions and financial reports.",price:"LKR 12,500"},
  "xero-cloud-accounting": {name:"Xero Cloud Accounting",category:"Digital Accounting",mark:"xero",desc:"Learn cloud-based bookkeeping, bank reconciliation and reporting with Xero.",overview:"Explore cloud accounting concepts, bank reconciliation and reports through guided examples.",price:"LKR 12,500"},
  "zoho-books-cloud": {name:"Zoho Books Cloud",category:"Digital Accounting",mark:"zoho",desc:"Understand cloud bookkeeping, invoicing and business finance workflows with Zoho Books.",overview:"Learn how invoices, expenses and routine bookkeeping tasks fit into a cloud-based accounting workflow.",price:"LKR 12,500"},
  "freshbooks-accounting": {name:"FreshBooks Accounting",category:"Digital Accounting",mark:"fb",desc:"Learn invoicing, expense tracking and client-focused accounting with FreshBooks.",overview:"Explore client billing, expense tracking and everyday bookkeeping processes with practical examples.",price:"LKR 12,500"},
  "chatgpt-accounting": {name:"ChatGPT for Accounting",category:"Artificial Intelligence for Accounting",mark:"✳",desc:"Use AI prompting to support accounting tasks, explanations and productivity workflows.",overview:"Learn how to frame useful prompts, check outputs carefully and use AI as an assistant for appropriate accounting workflows.",price:"LKR 12,500"},
  "gemini-ai-accounting": {name:"Gemini AI for Accounting",category:"Artificial Intelligence for Accounting",mark:"✦",desc:"Explore Gemini for research, document assistance and accounting-related productivity.",overview:"Explore AI-assisted research, document workflows and ways to review generated content for accuracy.",price:"LKR 12,500"},
  "claude-ai-accounting": {name:"Claude AI for Accounting",category:"Artificial Intelligence for Accounting",mark:"✴",desc:"Learn structured prompting and AI-assisted analysis for accounting work.",overview:"Practise structured prompting, document summarization and careful review of AI-assisted accounting outputs.",price:"LKR 12,500"},
  "gamma-ai-accounting": {name:"Gamma AI for Accounting",category:"Artificial Intelligence for Accounting",mark:"G",desc:"Create clear presentations and visual reports for accounting and finance topics.",overview:"Learn how to turn an outline into a presentation, refine the structure and review generated content before sharing.",price:"LKR 12,500"}
};
const params = new URLSearchParams(window.location.search);
const id = params.get("course") || "myob-accounting";
const course = courseData[id] || courseData["myob-accounting"];
document.title = `${course.name} | Texas Campus`;
document.querySelector("#breadcrumb-title").textContent = course.name;
document.querySelector("#detail-category").textContent = course.category.toUpperCase();
document.querySelector("#detail-title").textContent = course.name;
document.querySelector("#detail-description").textContent = course.desc;
document.querySelector("#detail-overview").textContent = course.overview;
document.querySelector("#detail-mark").textContent = course.mark;
document.querySelector("#purchase-name").textContent = course.name;
document.querySelector("#purchase-price").textContent = course.price;
const checkoutDialog = document.querySelector("#checkout-dialog");
const registerStep = document.querySelector("#checkout-step-register");
const paymentStep = document.querySelector("#checkout-step-payment");
const doneStep = document.querySelector("#checkout-step-done");
let checkoutStudent = null;
let demoOrder = null;

document.querySelector("#buy-button").addEventListener("click", () => {
  registerStep.hidden = false;
  paymentStep.hidden = true;
  doneStep.hidden = true;
  if (typeof checkoutDialog.showModal === "function") checkoutDialog.showModal();
});

document.querySelector(".checkout-close").addEventListener("click", () => checkoutDialog.close());
checkoutDialog.addEventListener("click", (event) => {
  if (event.target === checkoutDialog) checkoutDialog.close();
});

document.querySelector("#student-checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  checkoutStudent = {
    fullName: String(form.get("fullName")).trim(),
    username: String(form.get("username")).trim(),
    email: String(form.get("email")).trim(),
    mobile: String(form.get("mobile")).trim()
  };
  // Deliberately do not read or store the password in this front-end prototype.
  document.querySelector("#checkout-course-name").textContent = course.name;
  document.querySelector("#checkout-course-price").textContent = course.price;
  registerStep.hidden = true;
  paymentStep.hidden = false;
  doneStep.hidden = true;
});

document.querySelector("#demo-order-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const receipt = form.get("receipt");
  demoOrder = {
    course: course.name,
    price: course.price,
    student: checkoutStudent ? checkoutStudent.fullName : "",
    username: checkoutStudent ? checkoutStudent.username : "",
    email: checkoutStudent ? checkoutStudent.email : "",
    mobile: checkoutStudent ? checkoutStudent.mobile : "",
    depositor: String(form.get("depositor")).trim(),
    reference: String(form.get("reference")).trim(),
    receiptName: receipt && receipt.name ? receipt.name : "No file selected",
    status: "Pending — demo only"
  };
  const summary = document.querySelector("#demo-order-summary");
  summary.replaceChildren();
  [
    ["Course", demoOrder.course],
    ["Student", demoOrder.student],
    ["Email", demoOrder.email],
    ["Deposit reference", demoOrder.reference],
    ["Receipt file", demoOrder.receiptName],
    ["Status", demoOrder.status]
  ].forEach(([label, value]) => {
    const row = document.createElement("p");
    const key = document.createElement("span");
    const val = document.createElement("b");
    key.textContent = label;
    val.textContent = value;
    row.append(key, val);
    summary.appendChild(row);
  });
  paymentStep.hidden = true;
  doneStep.hidden = false;
});

document.querySelector("#finish-demo-order").addEventListener("click", () => checkoutDialog.close());
document.querySelector("#year").textContent = new Date().getFullYear();
