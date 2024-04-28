let map;

let selectedStoreId = -1;
let markers = [];

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

   console.log("fetching from /stores...");
   let resp = await fetch('/stores', {
      method: 'GET'
   })
   console.log(resp);
   if (resp.status == 200) {
      console.log('success');
      let storesArr = await resp.json();
      console.log("stores: " + JSON.stringify(storesArr));
      for (let i = 0; i < markers.length; i++) {
         markers[i].setMap(null);
      }
      for (let i = 0; i < storesArr.length; i++) {
         let store = storesArr[i];

         let marker = new AdvancedMarkerElement({
            map,
            position: {lat: Number(store.latlng.x), lng: Number(store.latlng.y)},
         });
         marker.addListener("click", () => {
            map.panTo(marker.position);
            updateStoreInfoDisplay(store.store_id);
         });
         markers.push(marker);

      }
   } else {
      alert('Error.')
   }
}

async function updateStoreInfoDisplay(storeId) {
   selectedStoreId = storeId;
   // hide the div if storeId is -1
   if (storeId == -1) {
      document.getElementById('storeInfo').className = "hide";
      return;
   }
   // fetch the detailed info and show the div
   console.log("fetching from /stores/" + storeId + "...");
   let resp = await fetch('/stores/' + storeId);
   if (resp.status == 200) {
      let info = await resp.json();
      console.log("info:" + JSON.stringify(info));
      document.getElementById('storeInfo').className = "show";
      document.getElementById('storeName').innerHTML = info.name;
      document.getElementById('storeAddress').innerHTML = 'Address: ' + info.address;
      document.getElementById('storeId').innerHTML = 'Store id: ' + info.store_id;
      // update info for the edit form
      document.getElementById('editStoreAddress').value = info.address;
      document.getElementById('editStoreLatitude').value = info.latlng.x;
      document.getElementById('editStoreLongitude').value = info.latlng.y;

   } else {
      alert(await resp.text());
   }
}

window.addEventListener("load", async (event) => {


   let addStore = document.getElementById('addStore');
   let editStore = document.getElementById('editStore');

   //let ifAdmin = false;
   console.log("fetching from /authRole...");
   let authResp = await fetch('/authRole', {
      method: 'GET'
   })
   let authJson = await authResp.json();
   console.log("authJson: " + JSON.stringify(authJson));
   let ifAdmin = (authJson.authRole == 'admin');

   //some code relating to logging into the admin account. 
   //if login is successful, ifAdmin is set to true
   if (ifAdmin == false) {
      addStore.className = "hide";
      editStore.className = 'hide';
   }
   else {
      addStore.className = "show";
      editStore.className = "show";
   }

   // add the address validation forms
   window.addAddressForm('editAddressValidationForm', onEditValidationConfirm);
   window.addAddressForm('addAddressValidationForm', onAddValidationConfirm);

   await window.loadLocations();
});

let storeId = selectedStoreId;


let editStoreAddress = document.getElementById('editStoreAddress');
let editStoreLongitude = document.getElementById('editStoreLongitude');
let editStoreLatitude = document.getElementById('editStoreLatitude');


window.addStore = async () => {

   let body = {
      address: document.getElementById('addStoreAddress').value,
      latitude: document.getElementById('addStoreLatitude').value,
      longitude: document.getElementById('addStoreLongitude').value,
   }

   console.log("fetching from /stores/add, body: " + JSON.stringify(body) + "...");
   let resp = await fetch('/stores/add',
      {
         method: 'POST',
         headers: {
            "Content-type": 'application/json',
         },
         body: JSON.stringify(body)
      }
   )

   if (resp.status == 200) {
      console.log(await resp.text())
      // alert('New Store Added.')
      // refresh the map
      await window.loadLocations();
   } else {
      alert(await resp.text());
   }
}

window.editStore = async () => {

   let body = {
      address: document.getElementById('editStoreAddress').value,
      latitude: document.getElementById('editStoreLatitude').value,
      longitude: document.getElementById('editStoreLongitude').value,
   }

   console.log("fetching from /stores/" + selectedStoreId + "/edit, body: " + JSON.stringify(body) + "...");
   let resp = await fetch(`/stores/${selectedStoreId}/edit`,
      {
         method: 'POST',
         headers: {
            "Content-type": 'application/json',
         },
         body: JSON.stringify(body)
      }
   )

   if (resp.status == 200) {
      console.log(await resp.text())
      // alert('Store info updated')
      // refresh the map
      await window.loadLocations();
      await updateStoreInfoDisplay(selectedStoreId);
   } else {
      alert(await resp.text());
   }
}

function onEditValidationConfirm(formattedAddress, location) {
   document.getElementById('editStoreAddress').value = formattedAddress;
   document.getElementById('editStoreLatitude').value = location.latitude;
   document.getElementById('editStoreLongitude').value = location.longitude;
}

function onAddValidationConfirm(formattedAddress, location) {
   document.getElementById('addStoreAddress').value = formattedAddress;
   document.getElementById('addStoreLatitude').value = location.latitude;
   document.getElementById('addStoreLongitude').value = location.longitude;
}


window.goToMenu = () => {
   setCookie('menuStoreId', selectedStoreId, 1);
   window.location.href = '../menu/menuLoading.html';
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

initMap();



