const variantLinks = {
  a: {
    consultant: "variant-a-consultant.html",
    upload: "variant-a-upload.html",
    admin: "variant-a-admin.html"
  },
  b: {
    consultant: "variant-b-consultant.html",
    upload: "variant-b-upload.html",
    admin: "variant-b-admin.html"
  }
};

function setIndexVariant(variant) {
  const root = document.querySelector("[data-index-root]");
  if (!root) return;

  root.dataset.variant = variant;
  document.querySelectorAll("[data-variant-button]").forEach((button) => {
    button.classList.toggle("active", button.dataset.variantButton === variant);
  });

  document.querySelectorAll("[data-screen-link]").forEach((link) => {
    const screen = link.dataset.screenLink;
    link.href = variantLinks[variant][screen];
  });

  document.querySelectorAll("[data-preview-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.previewCard === variant);
  });

  localStorage.setItem("design-v3-variant", variant);
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("design-v3-variant") || "a";
  setIndexVariant(saved);

  document.querySelectorAll("[data-variant-button]").forEach((button) => {
    button.addEventListener("click", () => setIndexVariant(button.dataset.variantButton));
  });
});
