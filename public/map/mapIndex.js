let map;

let selectedStoreId = -1;

async function initMap() {
   const {Map} = await google.maps.importLibrary("maps");

   map = new Map(document.getElementById("map"), {
      center: {lat: 40.523421858838276, lng: -74.45823918823967},
      zoom: 15,
      mapId: '5f088c2dddf9c012'
   });
   map.addListener('click', (event) => {
      event.stop();
      updateStoreInfoDisplay(-1);
   })
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

         let marker = new AdvancedMarkerElement({
            map,
            position: {lat: Number(store.latitude), lng: Number(store.longitude)},
         });
         marker.addListener("click", () => {
            map.panTo(marker.position);
            updateStoreInfoDisplay(store.store_id);
         });

      }
   } else {
      alert('Error.')
   }
}

async function updateStoreInfoDisplay(storeId) {
   selectedStoreId = storeId;
   // hide the div if storeId is -1
   if (storeId == -1) {
      document.getElementById('storeInfo').hidden = true;
      return;
   }
   // fetch the detailed info and show the div
   let resp = await fetch('/stores/' + storeId);
   if (resp.status == 200) {
      let info = await resp.json();
      console.log(info)
      document.getElementById('storeInfo').hidden = false;
      document.getElementById('storeAddress').innerHTML = info.address;
      document.getElementById('storeId').innerHTML = 'Store id: ' + info.store_id;

   } else {
      alert(await resp.text());
   }
}


initMap();



