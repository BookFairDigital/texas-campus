const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
    });
  });
}

const courseDescriptions = {
  "MYOB Accounting": "Learn MYOB accounting workflows, from core bookkeeping to practical business reporting.",
  "QuickBooks Desktop": "Build confidence using QuickBooks Desktop for everyday accounting tasks and small-business workflows.",
  "QuickBooks Online": "Learn cloud accounting, transactions, reports and day-to-day workflows using QuickBooks Online.",
  "Tally ERP Accounting": "Explore Tally ERP accounting workflows, practical entries and business reporting."
};

const detailsDialog = document.querySelector("#course-details");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");

document.querySelectorAll(".detail-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const courseName = link.dataset.course || "Course details";
    dialogTitle.textContent = courseName;
    dialogDescription.textContent = courseDescriptions[courseName] || "Course information will be available soon.";
    if (typeof detailsDialog.showModal === "function") {
      detailsDialog.showModal();
    } else {
      alert(`${courseName}\n\n${dialogDescription.textContent}\n\nSample price: LKR 12,500`);
    }
  });
});

document.querySelectorAll(".dialog-close, .dialog-ok").forEach((button) => {
  button.addEventListener("click", () => detailsDialog.close());
});

if (detailsDialog) {
  detailsDialog.addEventListener("click", (event) => {
    if (event.target === detailsDialog) detailsDialog.close();
  });
}

document.querySelector("#year").textContent = new Date().getFullYear();
