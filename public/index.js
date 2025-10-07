const header = document.createElement("h1")
header.textContent = "this is coming from js"

document.body.appendChild(header)

const map = L.map('map').setView([40, -100], 4)

L.tileLayer(
    ('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
    {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map)

//wait for the file to fetch the data from the server
try{
    const response = await fetch("http://localhost:8000/api")
    const residencies = await response.json()

    residencies.forEach(residency => {
        //create a marker at the associated residency coordinates
        const marker = L.marker([residency.lat, residency.lon]).addTo(map)

        //create a popup that when clicked shows the program name, city, and app status
        marker.bindPopup(`residency: ${residency.program}<br> city: ${residency.city}<br> ${residency.status}`)
    })
}catch(err){
    console.log(err)
}
