import { produceIconUrl } from "./produceIconUrl.js"

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

        const popupDiv = document.createElement("div")

        popupDiv.innerHTML = `
            <b>${popUpTitle}</b>
            <select>
                <option value="applied" ${status === "applied" ? "selected" : ""}>Applied</option>
                <option value="received-interview" ${status === "interview offered" ? "selected" : ""}>Received Interview</option>
                <option value="rejected" ${status === "rejected" ? "selected" : ""}>Rejected</option>
            </select>                
        `

        const marker = L.marker([lat, lng], {icon: produceIconUrl(status)}).addTo(map).bindPopup(popupDiv)

        const selectedElement = popupDiv.querySelector("select")

        selectedElement.addEventListener("change", function(){

            residency.status = this.value

            marker.setIcon(produceIconUrl(this.value))

            console.log(`${popUpTitle}'s status has been changed to ${this.value}`)
        })

    }

    )
}catch(err){
    console.log(err)
}

//so we need someway to associate the marker whose status has been changed from user input to the corresponding object in json.data. maybe I can use data attributes? uuids? create some rule that says "only push this data to the object whose coordinates match the current coordinates"?