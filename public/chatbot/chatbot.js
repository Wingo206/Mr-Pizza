window.addEventListener("load", async (event) => {
   let resp = await fetch('/chatbot/chatWindow.html', {
      method: 'GET'
   })
   let chatWindow = await resp.text();
   document.body.innerHTML += chatWindow;
})
