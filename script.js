'use strict';

// DOM Elements
const findLocationButton = document.getElementById('findLocationButton');
const output = document.getElementById('outputContainer');
const apikey = CONFIG.apiKey;
const copyCoordinatesButton = document.getElementById('copyCoordinates');

// Global Variables
let map = null; // global map variable for Leaflet map instance
let lat; // stores latitude coordinate of searched location
let lon; // stores longitude coordinate of searched location

// Fetches location data from OpenCage Geocoding API based on user input
function getLocation() {
  // Get the location input from the user
  const input = document.getElementById(`inputLocation`).value;

  // Encode the location string for URL compatibility
  const encodedLocation = encodeURIComponent(input);

  // Validate that input is not empty
  if (input.length === 0) {
    output.innerHTML = `<div class="error">Please enter a location</div>`;
    return;
  }

  // Make API request to OpenCage Geocoding API
  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${apikey}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Check if API request was successful
      if (data.status.code === 200) {
        // Extract results from successful response
        let results = data.results;

        // Extract latitude and longitude from first result
        lat = results[0].geometry.lat;
        lon = results[0].geometry.lng;

        // Update the UI with location information
        updateOutputHTML(results[0], lat, lon);

        // Create or update the map with new coordinates
        createOrUpdateMap(lat, lon);
      } else if (data.status.code <= 500) {
        // Handle server errors (4xx and 5xx status codes)
        output.innerHTML =
          'unable to geocode! Response code: ' + data.status.code;
      } else {
        // Handle unexpected server errors
        console.log('server error');
      }
    });
}
// Attach click event listener to search button
findLocationButton.addEventListener('click', getLocation);

// Updates the output container with location information
function updateOutputHTML(locationData, latitude, longitude) {
  output.innerHTML = `
      <div>Country: ${locationData.components.country}</div>
      <div>Address: ${locationData.formatted}</div>
      <div>Latitude: ${latitude}</div>
      <div>Longitude: ${longitude}</div>
      <div>Time Zone: ${locationData.annotations.timezone.name}</div>
      <div>Type: ${locationData.components._type}</div>
      <div>Category: ${locationData.components._category}</div>
      <div>State: ${locationData.components.state}</div>
      <div>City: ${locationData.components.city}</div>
      <div>Continent: ${locationData.components.continent}</div>
      `;
}

// Creates a new map or updates existing map with Leaflet
function createOrUpdateMap(lat, lon) {
  // Remove existing map if one is already displayed
  if (map) {
    map.remove();
  }
  // Create new map centered on the coordinates with zoom level 13
  map = L.map('map').setView([lat, lon], 13);

  // Add OpenStreetMap tile layer to the map
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Add a marker pin at the searched coordinates
  var marker = L.marker([lat, lon]).addTo(map);
}

// Allow pressing Enter key in the input field to submit the search
document.querySelector('input').addEventListener('keydown', function (event) {
  // Trigger search when Enter key is pressed
  if (event.key === 'Enter') {
    getLocation();
  }
});

// Resets the application state and clears all displayed information
function reset() {
  // Clear input field
  document.getElementById('inputLocation').value = '';
  // Clear output display
  output.innerHTML = '';
  // Reset coordinate variables
  lat = null;
  lon = null;
}
// Attach click event listener to reset button
document.getElementById('reset').addEventListener('click', reset);

// Copies the current coordinates to clipboard when button is clicked
copyCoordinatesButton.addEventListener('click', function () {
  // Check if coordinates are available before copying
  if (lat === null || lon === null) {
    // Alert user if no coordinates have been searched
    alert('No coordinates to copy!');
    return;
  }
  // Copy formatted coordinates to clipboard
  navigator.clipboard.writeText(`${lat}, ${lon}`);
  // Confirm to user that coordinates were copied
  alert('Coordinates copied!');
});
