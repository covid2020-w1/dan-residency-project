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

L.marker([40, -100]).addTo(map)