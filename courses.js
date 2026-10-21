const courses = [
  {id:"myob-accounting",name:"MYOB Accounting",category:"digital",mark:"myob",tone:"purple",desc:"Practical MYOB training covering bookkeeping workflows and business reports.",price:"LKR 12,500"},
  {id:"quickbooks-desktop",name:"QuickBooks Desktop",category:"digital",mark:"qb",tone:"green",desc:"Learn everyday accounting tasks and small-business workflows in QuickBooks Desktop.",price:"LKR 12,500"},
  {id:"quickbooks-online",name:"QuickBooks Online",category:"digital",mark:"qb",tone:"green",desc:"Explore cloud accounting, transactions and reporting in QuickBooks Online.",price:"LKR 12,500"},
  {id:"tally-erp-accounting",name:"Tally ERP Accounting",category:"digital",mark:"T",tone:"orange",desc:"Learn practical accounting entries, ledgers and business reporting with Tally ERP.",price:"LKR 12,500"},
  {id:"sage-50-accounting",name:"Sage 50 Accounting",category:"digital",mark:"sage",tone:"green",desc:"Build a foundation in desktop accounting, records and reports using Sage 50.",price:"LKR 12,500"},
  {id:"xero-cloud-accounting",name:"Xero Cloud Accounting",category:"digital",mark:"xero",tone:"blue",desc:"Learn cloud-based bookkeeping, bank reconciliation and reporting with Xero.",price:"LKR 12,500"},
  {id:"zoho-books-cloud",name:"Zoho Books Cloud",category:"digital",mark:"zoho",tone:"orange",desc:"Understand cloud bookkeeping, invoicing and business finance workflows with Zoho Books.",price:"LKR 12,500"},
  {id:"freshbooks-accounting",name:"FreshBooks Accounting",category:"digital",mark:"fb",tone:"blue",desc:"Learn invoicing, expense tracking and client-focused accounting with FreshBooks.",price:"LKR 12,500"},
  {id:"chatgpt-accounting",name:"ChatGPT for Accounting",category:"ai",mark:"✳",tone:"dark",desc:"Use AI prompting to support accounting tasks, explanations and productivity workflows.",price:"LKR 12,500"},
  {id:"gemini-ai-accounting",name:"Gemini AI for Accounting",category:"ai",mark:"✦",tone:"blue",desc:"Explore Gemini for research, document assistance and accounting-related productivity.",price:"LKR 12,500"},
  {id:"claude-ai-accounting",name:"Claude AI for Accounting",category:"ai",mark:"✴",tone:"orange",desc:"Learn structured prompting and AI-assisted analysis for accounting work.",price:"LKR 12,500"},
  {id:"gamma-ai-accounting",name:"Gamma AI for Accounting",category:"ai",mark:"G",tone:"purple",desc:"Create clear presentations and visual reports for accounting and finance topics.",price:"LKR 12,500"}
];

const grid = document.querySelector("#catalog-grid");
const count = document.querySelector("#results-count");
const filterButtons = [...document.querySelectorAll("[data-filter]")];

function makeCard(course) {
  const card = document.createElement("article");
  card.className = "catalog-card";
  card.dataset.category = course.category;
  const categoryLabel = course.category === "digital" ? "Digital Accounting" : "AI for Accounting";
  const artClass = course.category === "ai" ? "catalog-card-art ai-art-card" : "catalog-card-art";
  card.innerHTML = `
    <div class="${artClass}">
      <div class="course-laptop" aria-label="${course.name} logo on a laptop screen">
        <div class="laptop-screen">
          <div class="screen-brand ${course.tone}">
            <span class="screen-mark">${course.mark}</span>
            <span class="screen-name">${course.name}</span>
          </div>
          <div class="screen-glint"></div>
        </div>
        <div class="laptop-base"></div>
      </div>
    </div>
    <div class="catalog-card-content">
      <span class="course-category-label">${categoryLabel}</span>
      <h3>${course.name}</h3>
      <p>${course.desc}</p>
      <div class="catalog-card-bottom">
        <div class="catalog-price"><b>${course.price}</b></div>
        <div class="catalog-actions">
          <a class="small-action details" href="course.html?course=${course.id}">View Details</a>
          <a class="small-action buy" href="course.html?course=${course.id}#buy">Buy Now</a>
        </div>
      </div>
    </div>`;
  return card;
}

courses.forEach(course => grid.appendChild(makeCard(course)));

function setFilter(filter) {
  let visible = 0;
  [...grid.children].forEach(card => {
    const show = filter === "all" || card.dataset.category === filter;
    card.hidden = !show;
    if (show) visible++;
  });
  count.textContent = `Showing ${visible} course${visible === 1 ? "" : "s"}`;
  filterButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filter && button.classList.contains("filter-button"));
    if (button.classList.contains("filter-button")) button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  });
  document.querySelectorAll(".category-intro").forEach(button => button.classList.toggle("selected", button.dataset.filter === filter));
}

document.querySelectorAll(".filter-button, .category-intro").forEach(button => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

const params = new URLSearchParams(window.location.search);
const requestedCategory = params.get("category");
setFilter(["digital", "ai"].includes(requestedCategory) ? requestedCategory : "all");
document.querySelector("#year").textContent = new Date().getFullYear();
