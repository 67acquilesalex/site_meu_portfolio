const header = document.querySelector("[data-header]");
const filterButtons = document.querySelectorAll("[data-filter]");
const photoCards = document.querySelectorAll("[data-category]");

const updateHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    photoCards.forEach((card) => {
      const shouldShow = selected === "todos" || card.dataset.category === selected;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
