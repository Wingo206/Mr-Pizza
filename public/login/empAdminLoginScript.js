async function fetchEmployeeLogin() {
   let email = document.getElementById('empEmail').value;
   let password = document.getElementById('empPassword').value;
   let resp = await fetch('/employee/login', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({email: email, password: password})
   })
   console.log(resp);
   if (resp.status == 200) {
      window.location.href = 'loginSuccess.html'
   } else if (resp.status == 401) {
      alert(await resp.text())
   } else {
      alert(await resp.text())
   }
}

async function fetchAdminLogin() {
   let email = document.getElementById('adminEmail').value;
   let password = document.getElementById('adminPassword').value;
   let resp = await fetch('/admin/login', {
      method: 'POST',
      headers: {
         "Content-type": 'application/json',
      },
      body: JSON.stringify({email: email, password: password})
   })
   console.log(resp);
   if (resp.status == 200) {
      window.location.href = 'loginSuccess.html'
   } else if (resp.status == 401) {
      alert(await resp.text())
   } else {
      alert(await resp.text())
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
