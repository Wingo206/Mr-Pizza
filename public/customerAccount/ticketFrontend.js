window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
    // Check if the current page is the answerTicket.html page
    if (window.location.pathname === '/customerAccount/answerTicket.html') {
        await refreshForAnswerTickets();
    } else {
        await refresh();
    }
});

async function refresh() {
    let resp = await fetch('/support/pastTickets', {
        method: 'GET'
    });
    let pastTickets = await resp.json();
    console.log(pastTickets);
    document.getElementById('pastTickets').innerHTML = tableFromJSONArray(pastTickets);
}

async function refreshForAnswerTickets() {
    let resp = await fetch('/support/unansweredTickets', {
        method: 'GET'
    });
    let unansweredTickets = await resp.json();
    console.log(unansweredTickets);
    document.getElementById('pastTickets').innerHTML = tableFromJSONArrayUnanswered(unansweredTickets);
}

function tableFromJSONArray(tickets) {
    let output = '<table>';
    output += '<tr><th>Ticket ID</th><th>Description</th><th>Response</th></tr>';
    tickets.forEach(ticket => {
        output += `<tr>`;
        output += `<td>${ticket.id}</td>`;
        output += `<td>${ticket.description}</td>`;
        output += `<td>${ticket.response}</td>`;
        output += `</tr>`;
    });
    output += '</table>';
    return output;
}

function tableFromJSONArrayUnanswered(tickets) {
    let output = '<table>';
    output += '<tr><th>Ticket ID</th><th>Asked By</th><th>Description</th><th>Response</th></tr>';
    tickets.forEach(ticket => {
        output += `<tr>`;
        output += `<td>${ticket.id}</td>`;
        output += `<td>${ticket.asked_by}</td>`;
        output += `<td>${ticket.description}</td>`;
        // Create an input field for the response with a unique ID based on ticket ID
        output += `<td><input type="text" id="response_${ticket.id}" name="response_${ticket.id}"></td>`;
        // Create a submit button for each response
        output += `<td><button onclick="submitResponse(${ticket.id})">Submit</button></td>`;
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
                // Refresh the page after creating a ticket
                if (window.location.pathname === '/customerAccount/answerTicket.html') {
                    refreshForAnswerTickets();
                } else {
                    refresh();
                }
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

async function submitResponse(ticketId) {
    const responseData = document.getElementById(`response_${ticketId}`).value;

    try {
        const responseObj = { ticketId, response: responseData };
        const fetchResponse = await fetch('/support/respondToTicket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseObj)
        });

        if (fetchResponse.ok) {
            console.log("Response added successfully.");
            // Refresh the page to update the table
            await refreshForAnswerTickets();
        } else {
            console.error("Failed to add response.");
        }
    } catch (error) {
        console.error("Error adding response:", error);
    }
}