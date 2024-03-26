// /**
//  * Interesting example of using the Directions API with a panel to display the route.
//  * https://developers.google.com/maps/documentation/javascript/examples/directions-complex
//  */

// /**
//  * @license
//  * Copyright 2019 Google LLC. All Rights Reserved.
//  * SPDX-License-Identifier: Apache-2.0
//  */
// // [START maps_directions_panel]
// function initMap() {
//     const directionsRenderer = new google.maps.DirectionsRenderer();
//     const directionsService = new google.maps.DirectionsService();
//     const map = new google.maps.Map(document.getElementById("map"), {
//       zoom: 7,
//       center: { lat: 41.85, lng: -87.65 },
//       disableDefaultUI: true,
//       mapId: '5f088c2dddf9c012',
//     });
  
//     directionsRenderer.setMap(map);
//     directionsRenderer.setPanel(document.getElementById("sidebar"));
  
//     const control = document.getElementById("floating-panel");
  
//     map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
  
//     const onChangeHandler = function () {
//       calculateAndDisplayRoute(directionsService, directionsRenderer);
//     };
  
//     document.getElementById("start").addEventListener("change", onChangeHandler);
//     document.getElementById("end").addEventListener("change", onChangeHandler);
//   }
  
//   function calculateAndDisplayRoute(directionsService, directionsRenderer) {
//     const start = document.getElementById("start").value;
//     const end = document.getElementById("end").value;
  
//     directionsService
//       .route({
//         origin: start,
//         destination: end,
//         travelMode: google.maps.TravelMode.DRIVING,
//       })
//       .then((response) => {
//         directionsRenderer.setDirections(response);
//       })
//       .catch((e) => window.alert("Directions request failed due to " + status));
//   }
  
//   window.initMap = initMap;
//   // [END maps_directions_panel]

let map;
let destLat = 40.52362753497832;
let destLng = -74.43692635431962;
let srcLat = 40.523421858838276;
let srcLng = -74.45823918823967;
// let currLat;
// let currLng;

// if (navigator.geolocation) {
//   navigator.geolocation.getCurrentPosition((position) => {
//     currLat = position.coords.latitude;
//     currLng = position.coords.longitude;
//   });
// }

async function initMap() {
    const {Map} = await google.maps.importLibrary("maps");

    map = new Map(document.getElementById("map"), {
        center: {lat: 40.523421858838276, lng: -74.45823918823967},
        zoom: 15,
        mapId: '5f088c2dddf9c012'
    });

    const control = document.getElementById("floating-panel");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

    showRoute();

    // new AutocompleteDirectionsHandler(map);
}

async function fetchOrder() {
  let resp = await fetch('/directions/order', {
      method: 'GET'
  })
  console.log(resp);
  if (resp.status == 200) {
      console.log('success');
      let order = await resp.json();
      console.log(order);
      for (let i = 0; i < order.length; i++) {
          let order = order[i];

          let marker = new google.maps.Marker({
              map,
              position: {lat: Number(order.delivery_latlng.x), lng: Number(order.delivery_latlng.y)},
          });
          marker.addListener("click", () => {
              map.panTo(marker.position);
              updateOrderInfoDisplay(order.order_id);
          });

      }
  } else {
      alert('Error.')
  }

}

// function is called when the confirm done button is clicked, clearing the map and sidebar and displaying a message
window.confirmDone = async () => {
  alert("Order has been delivered!");
  document.getElementById("sidebar").style.display = "none";

  // document.getElementById("sidebar").style.display = "block";
  map = new google.maps.Map(document.getElementById("map"), {
      center: {lat: 40.523421858838276, lng: -74.45823918823967},
      zoom: 15,
      mapId: '5f088c2dddf9c012'
  });
}

// class AutocompleteDirectionsHandler {
//   map;
//   originPlaceId;
//   destinationPlaceId;
//   travelMode;
//   directionsService;
//   directionsRenderer;
//   constructor(map) {
//     this.map = map;
//     this.originPlaceId = "";
//     this.destinationPlaceId = "";
//     this.travelMode = google.maps.TravelMode.WALKING;
//     this.directionsService = new google.maps.DirectionsService();
//     this.directionsRenderer = new google.maps.DirectionsRenderer();
//     this.directionsRenderer.setMap(map);

//     const originInput = document.getElementById("origin-input");
//     const destinationInput = document.getElementById("destination-input");
//     const modeSelector = document.getElementById("mode-selector");
//     // Specify just the place data fields that you need.
//     const originAutocomplete = new google.maps.places.Autocomplete(
//       originInput,
//       { fields: ["place_id"] },
//     );
//     // Specify just the place data fields that you need.
//     const destinationAutocomplete = new google.maps.places.Autocomplete(
//       destinationInput,
//       { fields: ["place_id"] },
//     );

//     this.setupClickListener(
//       "changemode-walking",
//       google.maps.TravelMode.WALKING,
//     );
//     this.setupClickListener(
//       "changemode-transit",
//       google.maps.TravelMode.TRANSIT,
//     );
//     this.setupClickListener(
//       "changemode-driving",
//       google.maps.TravelMode.DRIVING,
//     );
//     this.setupPlaceChangedListener(originAutocomplete, "ORIG");
//     this.setupPlaceChangedListener(destinationAutocomplete, "DEST");
//     this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
//     this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(
//       destinationInput,
//     );
//     this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(modeSelector);
//   }
//   // Sets a listener on a radio button to change the filter type on Places
//   // Autocomplete.
//   setupClickListener(id, mode) {
//     const radioButton = document.getElementById(id);

//     radioButton.addEventListener("click", () => {
//       this.travelMode = mode;
//       this.route();
//     });
//   }
//   setupPlaceChangedListener(autocomplete, mode) {
//     autocomplete.bindTo("bounds", this.map);
//     autocomplete.addListener("place_changed", () => {
//       const place = autocomplete.getPlace();

//       if (!place.place_id) {
//         window.alert("Please select an option from the dropdown list.");
//         return;
//       }

//       if (mode === "ORIG") {
//         this.originPlaceId = place.place_id;
//       } else {
//         this.destinationPlaceId = place.place_id;
//       }

//       this.route();
//     });
//   }
//   route() {
//     if (!this.originPlaceId || !this.destinationPlaceId) {
//       return;
//     }

//     const me = this;

//     this.directionsService.route(
//       {
//         origin: { placeId: this.originPlaceId },
//         destination: { placeId: this.destinationPlaceId },
//         travelMode: this.travelMode,
//       },
//       (response, status) => {
//         if (status === "OK") {
//           me.directionsRenderer.setDirections(response);
//         } else {
//           window.alert("Directions request failed due to " + status);
//         }
//       },
//     );
//   }
// }


async function showRoute() {
    const {DirectionsService} = google.maps;
    const directionsService = new DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById("sidebar"));

    const request = {
        origin: {lat: srcLat, lng: srcLng},
        destination: {lat: srcLat, lng: srcLng},
        travelMode: google.maps.TravelMode.DRIVING,
        waypoints: [
            {location: {lat: destLat, lng: destLng}}
        ]
    }

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
        }
    });
}

initMap();