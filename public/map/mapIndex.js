let map;

async function initMap() {
   const {Map} = await google.maps.importLibrary("maps");

   map = new Map(document.getElementById("map"), {
      center: {lat: 40.523421858838276, lng: -74.45823918823967},
      zoom: 15,
      mapId: '5f088c2dddf9c012'
   });
}
window.loadLocations = async () => {
   const {AdvancedMarkerElement} = await google.maps.importLibrary("marker");

   console.log("Loading locations");
   const marker = new AdvancedMarkerElement({
      map,
      position: {lat: 40.523421858838276, lng: -74.45823918823967},
   });
}

initMap();



