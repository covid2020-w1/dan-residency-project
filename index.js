const map = L.map('map').setView([40, -97], 4);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 14,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

// const marker = L.marker([40.00, -97.00]).addTo(map)

// marker.bindPopup("hello")


// function onMapClick(e){
//     alert(`You clicked on ${e.latlng}`)
// }

// map.on('click', onMapClick)

const popup = L.popup()

// function onMapClick(e){
//     popup
//         .setLatLng(e.latlng)
//         .setContent(`You clicked on ${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)}`)
//         .openOn(map)
// }

// map.on("click", onMapClick)

//next, i want to automate the process of adding markers to the map. given the coordinates and name of a hospital, create a marker, put it on the map, and bind a popup to it that displays the name of the hospital

// function addMarkers(){
//     const marker = L.marker(coordinates).addTo(map)
// }

console.log(mapData)




const sheetsId = '1wwuog2omNUmbFhS8fczd_KmbrqaiUBCrrmiIY41ipHo'
const url = `https://opensheet.elk.sh/${sheetsId}/1`

fetch(url)
    .then(res => res.json())
    .then( data => {
        console.log(data)
        data.forEach( entry => {
            const { city, state, status } = entry
            const fullLocationName = city + ', ' + state
            console.log(status)

            // marker.bindPopup("hello")



            const API_KEY = '9cd88c87c9f57746c5ff7c6844489654dc88d64'

            const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(fullLocationName)}&api_key=${API_KEY}` 


            fetch(url)
                .then(response => response.json())
                .then(data => {
                    console.log(data.results[0].location.lat.toFixed(2))
                    const lat = data.results[0].location.lat
                    const lng = data.results[0].location.lng

                    const marker = L.marker([lat, lng]).addTo(map)

                    marker.bindPopup(`
                        <p>${entry.program}</p>
                        <span style="
                        background-color: #277FCA; 
                        color: white; 
                        padding: .25em .5em; 
                        border-radius: 16px;"
                        >${entry.status}</span>
                    `)
                })
                .catch(err => console.error(err))

                      
            
            //convert fullLocalName into coorfdinates with a Geocoding API

            //use coordinates to create pins for each entry

            //create popups for each pin showing hospital's name and location 

            //add a status to each popup that indicates 'applied'

            //create a way for user to change status from 'applied' to 'interview' or 'rejected'

            //add a section for daniel to add notes in google sheets, and have that appear in the popu up

            //change the popup into a modal/panel

            //make responsive and deploy

            //customize the markers to something fun

            //have the markers change color corresponding to status
})
    }
)
