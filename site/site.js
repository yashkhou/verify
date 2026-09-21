document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.copy);
    const original = button.textContent;
    button.textContent = "COPIED";
    setTimeout(() => button.textContent = original, 1200);
  });
});
