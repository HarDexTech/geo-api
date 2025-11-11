"use strict";

const findLocationButton = document.getElementById("findLocationButton");
const output = document.getElementById("outputContainer");
const apikey = "1667a20e1c5a4ec3b1d7e6b58dcb164f";

const getLocation = () => {
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
        const results = data.results;

        const lat = results[0].geometry.lat;
        const lon = results[0].geometry.lng;

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

        //   create map view
        var map = L.map("map").setView([lat, lon], 13);

        // add tiles to map
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        //add marker to coordinates
        var marker = L.marker([lat, lon]).addTo(map);
      } else if (data.status.code <= 500) {
        // We reached our target server, but it returned an error

        output.innerHTML =
          "unable to geocode! Response code: " + data.status.code;
      } else {
        console.log("server error");
      }
    });
  document.getElementById(`inputLocation`).value = "";
};
findLocationButton.addEventListener("click", getLocation);

// allow enter key to submit
document.querySelector("body").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    getLocation();
  }
});

// reset
function reset() {
  document.getElementById("inputLocation").value = "";
  output.innerHTML = "";
}
document.getElementById("reset").addEventListener("click", reset);
