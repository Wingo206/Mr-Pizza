window.addEventListener("load", async (event) => {
   let resp = await fetch('/chatbot/chatWindow.html', {
      method: 'GET'
   })
   let chatWindow = await resp.text();
   document.body.innerHTML += chatWindow;
   window.addChatResponse('Hi! I\'m Mr. Pizza. What would you like help with?')
   // add listener for enter inside the input
   let input = document.getElementById('chatInput');
   input.addEventListener('keydown', (event) => {
      if (event.key == 'Enter') {
         window.submitChatMessage();
      }
   })
})

window.addChatResponse = (text) => {
   let response = `<div class="responseDiv">
            <div class="responseAvatarDiv">
               <img src="/favicon.ico" alt="Avatar" class="avatar">
            </div>
            <div class="chatEntry response">
               <p class="chatText response">${text}</p>
            </div>
         </div> `;
   // add the new question to the chat
   let chat = document.getElementById('chat');
   chat.innerHTML += response;
   chat.scrollTop = chat.scrollHeight;
}

window.addChatQuestion = (text) => {
   let question = `<div class="chatEntry question">
         <p class="chatText question">${text}</p>
         </div> `
   // add the new question to the chat
   let chat = document.getElementById('chat');
   chat.innerHTML += question;
   chat.scrollTop = chat.scrollHeight;
}

window.submitChatMessage = async () => {
   console.log("Sending chat message");
   input = document.getElementById('chatInput');
   let text = input.value;

   //validate input question
   if (text.length == 0) {
      return;
   }
   input.value = '';

   window.addChatQuestion(text);
   // fetch response
   let body = {
      question: text,
   }
   let resp = await fetch('/chatbot', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify(body)
   })
   console.log(resp);
   if (resp.status == 200) {
      let respBody = await resp.json();
      console.log(respBody)
      window.addChatResponse(respBody.answer);
   }
}

window.toggleHideChat = () => {
   let contents = document.getElementById('contents');
   let toggleImage = document.getElementById('toggleImg')
   let closed = contents.classList.contains('closed')
   if (closed) {
      contents.classList.remove('closed');
      toggleImage.classList.remove('closed');
   } else {
      contents.classList.add('closed');
      toggleImage.classList.add('closed');
   }
}
