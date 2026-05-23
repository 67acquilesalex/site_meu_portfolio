document.querySelectorAll(".menu-group > button").forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.closest(".menu-group");
    const expanded = group?.classList.toggle("open");
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
});
