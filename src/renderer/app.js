const bridge = window.jeffAI;
const form = document.querySelector("#chat-form"), input = document.querySelector("#message-input"), messages = document.querySelector("#messages"), sendButton = document.querySelector("#send-button");
const modal = document.querySelector("#settingsModal"), planSelect = document.querySelector("#planSelect"), apiKeyInput = document.querySelector("#apiKeyInput"), modelSelect = document.querySelector("#modelSelect"), settingsStatus = document.querySelector("#settingsStatus");
function addMessage(role, text) {
  const item = document.createElement("article"); item.className = `message ${role}`;
  const label = document.createElement("div"); label.className = "message-label"; label.textContent = role === "user" ? "YOU" : "JEFF AI";
  const body = document.createElement("p"); body.textContent = text; item.append(label, body); messages.append(item); messages.scrollTop = messages.scrollHeight; return item;
}
function showStatus(text,bad=false){settingsStatus.textContent=text;settingsStatus.dataset.state=bad?"error":"ok";}
async function refreshSettings(){
  const s=await bridge.getSettings(); planSelect.value=s.plan;
  document.querySelector("#providerState").textContent=s.hasApiKey?"JT AI Core · Connected":"JT AI Core · Add API key";
  document.querySelector("#planState").textContent=`${s.plan[0].toUpperCase()+s.plan.slice(1)} plan · OpenRouter`;
  document.querySelector("#composerStatus").textContent=s.hasApiKey?`JT AI Core · ${s.plan} plan`:"Add OpenRouter API key in Settings";
  if(!s.secureStorageAvailable)showStatus("Secure credential storage is unavailable on this device.",true);
  else showStatus(s.hasApiKey?"API key is securely stored on this device.":"Add your OpenRouter API key to connect.");
}
async function refreshModels(){
  showStatus("Loading OpenRouter's free model catalogue…");
  try{const models=await bridge.listFreeModels(),current=modelSelect.value;modelSelect.replaceChildren(new Option("Automatic JT AI Core routing",""));
    for(const m of models)modelSelect.add(new Option(m.name+(m.context_length?` · ${Math.round(m.context_length/1000)}K context`:""),m.id));
    if([...modelSelect.options].some(o=>o.value===current))modelSelect.value=current;
    showStatus(`${models.length} currently free models found. Availability and limits can change.`);
  }catch(e){showStatus(e instanceof Error?e.message:"Could not load free models.",true);}
}
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{input.value=b.dataset.prompt||"";input.focus();}));
document.querySelector("#settingsOpen").addEventListener("click",async()=>{modal.hidden=false;await refreshSettings();const s=await bridge.getSettings();await refreshModels();modelSelect.value=s.selectedModel||"";});
document.querySelector("#settingsClose").addEventListener("click",()=>{modal.hidden=true;});
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true;});
document.querySelector("#refreshModels").addEventListener("click",refreshModels);
document.querySelector("#saveSettings").addEventListener("click",async()=>{
  const button=document.querySelector("#saveSettings");button.disabled=true;
  try{const result=await bridge.saveSettings({apiKey:apiKeyInput.value||undefined,plan:planSelect.value,selectedModel:modelSelect.value});apiKeyInput.value="";
    document.querySelector("#providerState").textContent=result.hasApiKey?"JT AI Core · Connected":"JT AI Core · Add API key";
    document.querySelector("#planState").textContent=`${result.plan[0].toUpperCase()+result.plan.slice(1)} plan · OpenRouter`;
    document.querySelector("#composerStatus").textContent=result.hasApiKey?`JT AI Core · ${result.plan} plan`:"Add OpenRouter API key in Settings";
    showStatus("Settings saved securely on this device.");
  }catch(e){showStatus(e instanceof Error?e.message:"Could not save settings.",true);}finally{button.disabled=false;}
});
form.addEventListener("submit",async e=>{e.preventDefault();const message=input.value.trim();if(!message||sendButton.disabled)return;
  const welcome=messages.querySelector(".welcome");if(welcome)welcome.remove();addMessage("user",message);input.value="";input.style.height="auto";sendButton.disabled=true;const pending=addMessage("assistant","Thinking…");
  try{pending.querySelector("p").textContent=await bridge.sendMessage(message);}catch(error){pending.querySelector("p").textContent=error instanceof Error?error.message:"Something went wrong. Please try again.";}finally{sendButton.disabled=false;input.focus();}
});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=`${Math.min(input.scrollHeight,180)}px`;});
refreshSettings().catch(e=>showStatus(e.message,true));
