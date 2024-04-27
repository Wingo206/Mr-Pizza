let map;
let assignedOrders = [];

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: { lat: 40.523421858838276, lng: -74.45823918823967 },
        zoom: 15,
        mapId: '5f088c2dddf9c012'
    });

    const control = document.getElementById("floating-panel");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

    await fetchAssignedOrders();
}

async function fetchAssignedOrders() {
    console.log('fetching assigned orders from /directions/assignedOrder...');
    let resp = await fetch('/directions/assignedOrder', {
        method: 'GET'
    })
    console.log('resp: ' + JSON.stringify(resp));

    if (resp.status == 200) {
        console.log('success');
        assignedOrders = await resp.json();
        console.log(assignedOrders);
        await fetchWaypoints();
    } else {
        alert('Error.')
    }
}

async function fetchWaypoints() {
    console.log('fetching employee store info from /employeeStoreInfo...');
    // get the info about the currently signed in user
    let resp = await fetch('/employeeStoreInfo', {
        method: 'GET'
    })
    if (resp.status != 200) {
        console.log(await resp.text());
        return;
    }
    let esInfo = await resp.json();

    // make order id array
    let orderIds = assignedOrders.map(o => o.order_id);
    console.log('fetching waypoints from /directions/waypoints/' + esInfo.store_id + '...');
    resp = await fetch('/directions/waypoints/' + esInfo.store_id,
        {
            method: 'GET',
            headers: {
                "Content-type": 'application/json',
            },
            body: JSON.stringify({ orders: orderIds })
        }
    )
    if (resp.status != 200) {
        console.log(await resp.text());
        return;
    }
    let waypoints = await resp.json();

    // render the directions
    displayRoute(waypoints);
}

// function is called when the start delivery button is clicked that goes to the geolocation backend
window.startDelivery = async () => {
    console.log("updating the status of the driver...");
    let resp = await fetch('/directions/updateDriver', {
        method: 'POST'
    })

    if (resp.status != 200) {
        console.log(await resp.text());
        return;
    }

    // starts tracking the location of the driver
    console.log("updating the location of the driver every 30 seconds...");
}

/**
 * fetches the assigned orders for the currently logged in driver,
 * then fetches the route to display from the list of orders.
 */
async function displayRoute(waypoints) {
    console.log(waypoints);

    // get directions and render on map
    const { DirectionsService } = google.maps;
    const directionsService = new DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById("sidebar"));

    let origin = waypoints.shift();
    let destination = waypoints.pop();

    const request = {
        origin: { lat: origin.x, lng: origin.y },
        destination: { lat: destination.x, lng: destination.y },
        travelMode: google.maps.TravelMode.DRIVING,
        waypoints: waypoints.map(w => {
            return {
                location: { lat: w.x, lng: w.y }
            }
        })
    }

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
        }
    });

}

initMap();