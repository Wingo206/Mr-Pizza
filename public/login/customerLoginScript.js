async function fetchRegister() {
   let username = document.getElementById('registerUsername').value;
   let password = document.getElementById('registerPassword').value;
   let resp = await fetch('/customer/register', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({username: username, password: password})
   })
   console.log(resp);
   if (resp.status == 201) {
      alert('registered successfully.')
   } else if (resp.status == 409) {
      alert('Username is already used.')
   }
}

async function fetchLogin() {
   let username = document.getElementById('loginUsername').value;
   let password = document.getElementById('loginPassword').value;
   let resp = await fetch('/customer/login', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({username: username, password: password})
   })
   console.log(resp);
   if (resp.status == 200) {
      // alert('logged in successfully. Redirecting to home page.')
      window.location.href = '/html/loginSuccess.html'
   } else if (resp.status == 401) {
      alert(await resp.text())
   } else {
      alert('Error.')
   }
}

async function signOut() {
   let resp = await fetch('/logout', {
      method: 'POST',
   })
   if (resp.status == 200) {
      alert('signed out')
   } else {
      alert('Error.')
   }
}
