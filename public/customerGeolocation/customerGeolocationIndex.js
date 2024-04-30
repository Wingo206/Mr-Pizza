let map;
let markers = [];


async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: 40.523421858838276, lng: -74.45823918823967 },
        zoom: 15,
        mapId: '5f088c2dddf9c012'
    });

    const control = document.getElementById("floating-panel");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
}

async function updateOrderMap() {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    // gets the current customer's delivery address
    let resp = await fetch('/geolocation/fetchCustomerPos', {
        method: 'GET'
    });
    let body1 = await resp.json()
    console.log(body1)

    let myAddress = body1.delivery_latlng;
    console.log(myAddress)
    let marker1 = new AdvancedMarkerElement({
        map,
        position: { lat: myAddress.x, lng: myAddress.y },
        title: 'Delivery Address'
    })
    markers.push(marker1);

    // gets the order position of the current customer
    let resp2 = await fetch('/geolocation/fetchOrderPosCustomer', {
        method: 'GET'
    });
    let body2 = await resp2.json();
    console.log(body2)

    let orderPos = (body2).current_latlng;
    let marker2 = new AdvancedMarkerElement({
        map,
        position: { lat: orderPos.x, lng: orderPos.y },
        title: 'Order\'s Location'
    })
    markers.push(marker2);

    let resp3 = await fetch('/timeEst/getOrderTimeEst', {
        method: 'GET'
    })

    let timeEstimate = (await resp3.json()).timeEstimate
    // updates the text for the time remaining
    document.getElementById('timeEst').textContent = timeEstimate;
}

initMap();
// set to 5 seconds for now

window.addEventListener("load", async (event) => {
    setInterval(updateOrderMap, 5000);
    updateOrderMap();
})
