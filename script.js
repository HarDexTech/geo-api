'use strict';

// DOM Elements
const findLocationButton = document.getElementById('findLocationButton');
const calculateDistance = document.getElementById('calculateDistance');
const distanceResult = document.getElementById('distanceResult');
const output = document.getElementById('outputContainer');
const historyOutput = document.getElementById('historyOutput');
const historyList = document.getElementById('historyList');
const apikey = CONFIG.apiKey;
const copyCoordinatesButton = document.getElementById('copyCoordinates');
const targetSection = document.getElementById('resultsSection');

let searchHistory = []; // array to store search history
let selectedItems = []; // array to store selected history items for distance calculation

calculateDistance.classList.add('invisible');

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

  output.innerHTML = ``; // Clear previous output
  distanceResult.innerHTML = ``; // Clear previous distance result

  // Show loading icon
  document.getElementById('loadingContainer').classList.remove('invisible');

  // Make API request to OpenCage Geocoding API
  fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${encodedLocation}&key=${apikey}`
  )
    .then((response) => response.json())
    .then((data) => {
      // Check if API request was successful
      if (data.status.code === 200) {
        // Extract results from successful response
        const results = data.results;

        // Extract latitude and longitude from first result
        lat = results[0].geometry.lat;
        lon = results[0].geometry.lng;

        // Hide loading icon
        document.getElementById('loadingContainer').classList.add('invisible');

        // Update the UI with location information
        updateOutputHTML(results[0], lat, lon);

        // Create or update the map with new coordinates
        createOrUpdateMap(lat, lon);

        //add to history
        addToHistory(input, lat, lon, results[0].formatted, data);

        targetSection.classList.remove('invisible');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (data.status.code <= 500) {
        // Handle server errors (4xx and 5xx status codes)
        output.innerHTML =
          'unable to geocode! Response code: ' + data.status.code;
      } else {
        // Handle unexpected server errors
        alert('server error');
      }
    })
    .catch((error) => {
      output.innerHTML = `<div class="error">Network error. Check your connection.</div>`;
      console.error('Fetch failed:', error);
    });

  selectedItems = [];
}
// Attach click event listener to search button
findLocationButton.addEventListener('click', getLocation);

// Updates the output html container with location information
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

//function to create history
function addToHistory(input, lat, lon, address, data) {
  historyList.innerHTML = ``; //empty the history list before adding new entry

  const historyObject = new Object(); //create a new object to store history entry

  //add properties to the history object
  historyObject.Location = input;
  historyObject.Latitude = lat;
  historyObject.Longitude = lon;
  historyObject.Address = address;
  historyObject.requestFromApi = data;

  searchHistory.push(historyObject); //add the new history object to the search history array

  //loop through the search history array and display each entry in the history list
  for (let i = 0; i < searchHistory.length; i++) {
    historyList.innerHTML += `
    <div id="historyDiv">
      <li>
        <input type="checkbox" class="checkboxclass" id="checkbox-${i}" onchange="handleCheckBoxChange(${i}, this.checked)" style="width: 20px; height: 20px;"/>
        <div class="history-item" id="historyItem">
          <strong>Location:</strong> ${searchHistory[i].Location},
          <strong>Latitude:</strong> ${searchHistory[i].Latitude},
          <strong>Longitude:</strong> ${searchHistory[i].Longitude},
          <strong>Address:</strong> ${searchHistory[i].Address}
        </div>
      </li>
    </div>`;
  }
}

//change deg to radian for the haversine formula
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

//haversine formula to calculate distance between two coordinates
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers (can be adjusted for miles, etc.)

  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in kilometers
  distanceResult.innerHTML = `Distance between selected locations: ${distance.toFixed(
    2
  )} km`;
}

// Handle checkbox changes for selecting history items
function handleCheckBoxChange(index, isChecked) {
  // Get the history item at this index
  if (isChecked) {
    // Show location on map when selected
    createOrUpdateMap(
      searchHistory[index].Latitude,
      searchHistory[index].Longitude
    );
    // Update output with selected location details
    updateOutputHTML(
      searchHistory[index].requestFromApi.results[index],
      searchHistory[index].Latitude,
      searchHistory[index].Longitude
    );
    // Clear input field
    document.getElementById('inputLocation').value = '';
    // Add to selected items
    if (selectedItems.length >= 2) {
      // Already have 2 selected - prevent this
      alert('You can only select 2 locations');
      // Uncheck the checkbox that was just clicked
      document.getElementById(`checkbox-${index}`).checked = false;
      return;
    }
    selectedItems.push(searchHistory[index]);
    calculateDistance.classList.remove('invisible');
  }
  if (!isChecked) {
    // Remove from selected items
    selectedItems = selectedItems.filter(
      (item, i) => i !== selectedItems.indexOf(searchHistory[index])
    );
    if (selectedItems.length === 0) {
      calculateDistance.classList.add('invisible');
    }
  }
}

//calculate distance button
calculateDistance.addEventListener('click', function () {
  if (selectedItems.length !== 2) {
    alert('Please select exactly 2 locations to calculate distance');
    return;
  }
  const loc1 = selectedItems[0];
  const loc2 = selectedItems[1];
  calculateHaversineDistance(
    loc1.Latitude,
    loc1.Longitude,
    loc2.Latitude,
    loc2.Longitude
  );
});
