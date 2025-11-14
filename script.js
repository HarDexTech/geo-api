'use strict';

const findLocationButton = document.getElementById('findLocationButton');
const output = document.getElementById('outputContainer');
const apikey = CONFIG.apiKey;
const copyCoordinatesButton = document.getElementById('copyCoordinates');
let map = null; // global map variable

//create an empty variable for latitude and longitude coordinates
let lat;
let lon;

let results;

function getLocation() {
  // get location
  const input = document.getElementById(`inputLocation`).value;

  // encode location
  const encodedLocation = encodeURIComponent(input);

  if (input.length === 0) {
    output.innerHTML = `<div class="error">Please enter a location</div>`;
    return;
  }

  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${apikey}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.status.code === 200) {
        //success
        results = data.results;

        lat = results[0].geometry.lat;
        lon = results[0].geometry.lng;

        updateOutputHTML(); //html function

        createOrUpdateMap(lat, lon); //add the create map function
      } else if (data.status.code <= 500) {
        // We reached our target server, but it returned an error
        output.innerHTML =
          'unable to geocode! Response code: ' + data.status.code;
      } else {
        console.log('server error');
      }
    });
  document.getElementById(`inputLocation`).value = '';
}
findLocationButton.addEventListener('click', getLocation);

//update the html in the output container
function updateOutputHTML() {
  output.innerHTML = `
      <div>Country: ${results[0].components.country}</div>
      <div>Address: ${results[0].formatted}</div>
      <div>Latitude: ${lat}</div>
      <div>Longitude: ${lon}</div>
      <div>Time Zone: ${results[0].annotations.timezone.name}</div>
      <div>Type: ${results[0].components._type}</div>
      <div>Category: ${results[0].components._category}</div>
      <div>State: ${results[0].components.state}</div>
      <div>City: ${results[0].components.city}</div>
      <div>Continent: ${results[0].components.continent}</div>
      `;
}

//create and update map function
function createOrUpdateMap(lat, lon) {
  if (map) {
    map.remove(); //remove existing map
  }
  //   create map view
  map = L.map('map').setView([lat, lon], 13);

  // add tiles to map
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  //add marker to coordinates
  var marker = L.marker([lat, lon]).addTo(map);
}

// allow enter key to submit
document.querySelector('input').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    getLocation();
  }
});

// reset
function reset() {
  document.getElementById('inputLocation').value = '';
  output.innerHTML = '';
  lat = null;
  lon = null;
}
document.getElementById('reset').addEventListener('click', reset);

// copy coordinates to clipboard
copyCoordinatesButton.addEventListener('click', function () {
  // In copy function:
  if (lat === null || lon === null) {
    alert('No coordinates to copy!');
    return;
  }
  navigator.clipboard.writeText(`${lat}, ${lon}`);
  alert('Coordinates copied!');
});
