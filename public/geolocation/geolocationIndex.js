let map;
let markers = [];

// debug variables
let count = 0;
let offset = 0.001;

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

/**
 * (currently) centers the map to a changing current position and places a marker there
 * 
 * TODO: make a call to the backend that updates the current_latlng in delivery batch each time it updates depending on the order
 */
async function updateLocation() {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    if(navigator.geolocation) {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: (position.coords.latitude + count*offset),
                    lng: (position.coords.longitude + count*offset)
                };
                
                // currently sets the map's center at this position, can remove this later
                map.setCenter(pos);

                // debug
                console.log(pos);

                let marker = new AdvancedMarkerElement({
                    map,
                    position: { lat: Number(pos.lat), lng: Number(pos.lng) },
                });
                markers.push(marker);
                count++;
            }
        );
    }
}

// test function for the button, doesn't really work anymore/isn't relevant
window.currLocation = async () => {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map.setCenter(pos);

                console.log(pos);

                currPosMarker = new AdvancedMarkerElement({
                    map,
                    position: { lat: Number(pos.lat), lng: Number(pos.lng) },
                 });
            }
        );
    }
}

initMap();

/**
 * this setInterval function can be hidden inside of a function that is called when a button is pressed
 * and turned off when another button is pressed?
 * 
 * 
 */
// 30000 = 30 sec || 10000 = 10 sec
setInterval(updateLocation, 10000)