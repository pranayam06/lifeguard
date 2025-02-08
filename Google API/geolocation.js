function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const map = new google.maps.Map(document.getElementById("map"), {
          center: userLocation,
          zoom: 12,
        });

        // Use AdvancedMarkerElement instead of Marker
        new google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: map,
          title: "Your Location",
        });

        // Fetch nearby help centers dynamically
        findHelpCenters(map, userLocation);
      },
      (error) => {
        console.error("Error getting location:", error);
        const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // Default to SF

        const map = new google.maps.Map(document.getElementById("map"), {
          center: defaultLocation,
          zoom: 12,
        });

        findHelpCenters(map, defaultLocation);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

function findHelpCenters(map, userLocation) {
  const service = new google.maps.places.PlacesService(map);
  service.nearbySearch(
    {
      location: userLocation,
      radius: 10000, // 10km search radius
      keyword: "LGBTQ+ support center",
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.forEach((place) => {
          new google.maps.marker.AdvancedMarkerElement({
            position: place.geometry.location,
            map: map,
            title: place.name,
          });
        });
      } else {
        console.error("No help centers found:", status);
      }
    }
  );
}
