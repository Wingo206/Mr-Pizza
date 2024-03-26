let email, subject, message;

// Default email, subject, and message values for automated email when the user makes a delivery request
let defaultEmail = null;

async function fetchEmail() {
    email = document.getElementById('email').value;
    subject = document.getElementById('subject').value;
    message = document.getElementById('message').value;
    let resp = await fetch('/email/send', {
        method: 'POST',
        headers: {
            "Content-type": 'application/json',
        },
        body: JSON.stringify({email: email, subject: subject, message: message})
    })
    console.log(resp);

    if (resp.status == 200) {
        alert('Email sent successfully.')
    } else {
        alert('Error.')
    }
}