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

   let resp = await fetch('/stores', {
      method: 'GET'
   })
   console.log(resp);
   if (resp.status == 200) {
      console.log('success');
      let storesArr = await resp.json();
      console.log(storesArr);
      for (let i = 0; i < storesArr.length; i++) {
         let store = storesArr[i];

         console.log(store)
         let marker = new AdvancedMarkerElement({
            map,
            position: {lat: Number(store.latitude), lng: Number(store.longitude)},
         });
      }
   } else {
      alert('Error.')
   }
   // const marker = new AdvancedMarkerElement({
   //    map,
   //    position: {lat: 40.523421858838276, lng: -74.45823918823967},
   // });
}

initMap();



