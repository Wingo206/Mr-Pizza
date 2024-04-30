// let cid;

window.addEventListener("load", async (event) => {
    console.log("page is fully loaded");
    await refresh();
 });

 async function refresh(){
    // let resp = await fetch('/custumerInfo', {
    //     method: 'GET'
    // })
    // let caInfo = await resp.json();
    // console.log(caInfo);
    // cid = caInfo.cid;
    // console.log("Hello 1");
    let resp = await fetch('/getCustomerInfo', {
        method: 'GET'
    })
    // console.log("Hello 2");
    let caAccountInfo = await resp.json();
    console.log(caAccountInfo);
    // console.log("Hello");
    document.getElementById('customerInfoTable').innerHTML = tableFromJSONArray(caAccountInfo);
 }

function tableFromJSONArray(caAccountInfo){
    let output = '<th>Username</th><th>Delivery Address</th><th>Phone Number</th><th>Email</th><th>Rewards Points</th>';
    output += '<tr>';
    output += `<td>${JSON.stringify(caAccountInfo.username)}</td>`;
    output += `<td>${JSON.stringify(caAccountInfo.default_delivery_address)}</td>`;
    output += `<td>${JSON.stringify(caAccountInfo.phone_num)}</td>`;
    output += `<td>${JSON.stringify(caAccountInfo.email)}</td>`;
    output += `<td>${JSON.stringify(caAccountInfo.rewards_points)}</td>`;
    output += '</tr>';
    // console.log("Hello");
    return output;    
}


async function fetchCustomerInfo(){
    window.location.href = "customerAccount.html";
}

