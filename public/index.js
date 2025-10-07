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
        const {popUpTitle, status, lat, lng} = residency

        let popupContent = ""

        const MarkerIcon = L.Icon.extend({
            options: {
                shadowUrl: "images/pin-shadow.png",
                iconSize: [20, 30],
                shadowSize: [20, 30],
                iconAnchor: [13, 30],
                shadowAnchor: [4, 30],
                popupAnchor: [0, -32]
            }
        })

        const acceptedIcon = new MarkerIcon({iconUrl: "images/pin-applied.png"})
        const rejectedIcon = new MarkerIcon({iconUrl: "images/pin-rejected.png"})
        const interviewReceivedIcon = new MarkerIcon({iconUrl: "images/pin-interview_received.png"})

        if(status === "applied"){
            popupContent = `
                <b>${popUpTitle}</b>
                <select>
                    <option value="applied" selected>Applied</option>
                    <option value="received-interview">Received Interview</option>
                    <option value="rejected">Rejected</option>
                </select>                
            `

            L.marker([lat, lng], {icon: acceptedIcon}).addTo(map).bindPopup(popupContent)

        }else if(status === "interview offered"){
            popupContent = `
                <b>${popUpTitle}</b>
                <select>
                    <option value="applied">Applied</option>
                    <option value="received-interview" selected>Received Interview</option>
                    <option value="rejected">Rejected</option>
                </select>                  
            `

            L.marker([lat, lng], {icon: interviewReceivedIcon}).addTo(map).bindPopup(popupContent)

        }else if(status === "rejected"){
            popupContent = `
                <b>${popUpTitle}</b>
                <select>
                    <option value="applied">Applied</option>
                    <option value="received-interview">Received Interview</option>
                    <option value="rejected" selected>Rejected</option>
                </select>                      
            `

            L.marker([lat, lng], {icon: rejectedIcon}).addTo(map).bindPopup(popupContent)

        }

    })
}catch(err){
    console.log(err)
}
