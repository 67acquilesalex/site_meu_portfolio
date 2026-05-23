const budgetForm = document.querySelector("[data-budget-form]");
const whatsappNumber = "5592999999999";

if (budgetForm) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(budgetForm);
    const message = [
      "Olá! Gostaria de solicitar um orçamento.",
      "",
      `Nome: ${formData.get("nome") || ""}`,
      `Telefone: ${formData.get("telefone") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Data da sessão: ${formData.get("data") || "A definir"}`,
      `Segmento: ${formData.get("segmento") || ""}`,
      `Mensagem: ${formData.get("mensagem") || ""}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
}
