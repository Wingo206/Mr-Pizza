window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
    await refresh();
});

async function refresh() {
    let resp = await fetch('/support/pastTickets', {
        method: 'GET'
    });
    let pastTickets = await resp.json();
    console.log(pastTickets);
    document.getElementById('pastTickets').innerHTML = tableFromJSONArray(pastTickets);
}

function tableFromJSONArray(pastTickets) {
    let output = '<table>';
    output += '<tr><th>Ticket ID</th><th>Description</th><th>Response</th></tr>';
    pastTickets.forEach(ticket => {
        output += `<tr>`;
        output += `<td>${ticket.id}</td>`;
        output += `<td>${ticket.description}</td>`;
        output += `<td>${ticket.response}</td>`;
        output += `</tr>`;
    });
    output += '</table>';
    return output;
}

async function createTicket() {
    const description = document.getElementById('description').value;
    if (description) {
        try {
            let resp = await fetch('/support/createTicket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ description })
            });
            if (resp.ok) {
                console.log("Ticket created successfully.");
                refresh();
            } else {
                console.error("Failed to create ticket.");
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
        }
    } else {
        console.error("Description is required.");
    }
}