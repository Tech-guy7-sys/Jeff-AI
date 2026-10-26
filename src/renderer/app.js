const bridge = window.jeffAI;
const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");

function addMessage(role, text) {
  const item = document.createElement("article");
  item.className = `message ${role}`;
  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "user" ? "YOU" : "JEFF AI";
  const body = document.createElement("p");
  body.textContent = text;
  item.append(label, body);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
  return item;
}

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt || "";
    input.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || sendButton.disabled) return;
  const welcome = messages.querySelector(".welcome");
  if (welcome) welcome.remove();
  addMessage("user", message);
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  const pending = addMessage("assistant", "Thinking…");
  try {
    const reply = await bridge.sendMessage(message);
    pending.querySelector("p").textContent = reply;
  } catch (error) {
    pending.querySelector("p").textContent = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
});
