function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [position.coords.latitude, position.coords.longitude];

        // Initialize the Leaflet map
        const map = L.map("map").setView(userLocation, 12);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Add a marker for the user's location
        L.marker(userLocation)
          .addTo(map)
          .bindPopup("Your Location")
          .openPopup();

        // Fetch nearby transgender help centers using Overpass API
        findHelpCenters(map, userLocation);
      },
      (error) => {
        console.error("Error getting location:", error);
        const defaultLocation = [37.7749, -122.4194]; // Default to San Francisco

        // Initialize the Leaflet map with a default location
        const map = L.map("map").setView(defaultLocation, 12);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Fetch nearby transgender help centers using Overpass API
        findHelpCenters(map, defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

const pinkIcon = L.icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/pink-dot.png", // Pink marker image
  iconSize: [40, 40], // Size of the icon
  iconAnchor: [16, 32], // Point of icon corresponding to marker's location
  popupAnchor: [0, -32], // Point where popup opens
});

function findHelpCenters(map, userLocation) {
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  const query = `
    [out:json];
    node["lgbtq"](around:20000, ${userLocation[0]}, ${userLocation[1]});
    out body;
    >;
    out skel qt;
  `;

  fetch(overpassUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Overpass API Response:", data);
      if (data.elements && data.elements.length > 0) {
        data.elements.forEach((element) => {
          if (element.tags && element.tags.name) {
            // Use the pink icon for help center markers
            L.marker([element.lat, element.lon], { icon: pinkIcon })
              .addTo(map)
              .bindPopup(`<b>${element.tags.name}</b>`);
          }
        });
      } else {
        console.log("No transgender help centers found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Overpass API:", error);
    });
}

// Expose the initMap function to the global scope
window.initMap = initMap;