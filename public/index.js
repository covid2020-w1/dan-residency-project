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

    // After loading residencies, before creating markers
    const coordinateGroups = {};
    residencies.forEach((residency, index) => {
        const key = `${residency.lat},${residency.lng}`;
        if (!coordinateGroups[key]) {
            coordinateGroups[key] = [];
        }
        coordinateGroups[key].push({residency, index});
    });

    // Apply offsets to duplicates
    Object.values(coordinateGroups).forEach(group => {
        if (group.length > 1) {
            group.forEach((item, i) => {
                // Small circular offset pattern
                const angle = (i / group.length) * 2 * Math.PI;
                const offsetDistance = 0.01; // Adjust as needed
                item.residency.lat += Math.cos(angle) * offsetDistance;
                item.residency.lng += Math.sin(angle) * offsetDistance;
            });
        }
    });    

    //loop through each residency object in the array of residencies
    residencies.forEach(residency => {

        //deconstruct the properties from residency that you are going to use
        const {popUpTitle, status, lat, lng} = residency

        //create a div element
        const popupDiv = document.createElement("div")

        //put a select element inside the div element. Use ternary operators so that the current value of status coming from the data is the option pre-selected in the html
        popupDiv.innerHTML = `
            <b>${popUpTitle}</b>
            <select>
                <option value="applied" ${status === "applied" ? "selected" : ""}>Applied</option>
                <option value="interview offered" ${status === "interview offered" ? "selected" : ""}>Interview Offered</option>
                <option value="rejected" ${status === "rejected" ? "selected" : ""}>Rejected</option>
            </select>                
        `

        //create a marker on the map for the given residency program's coordinates and icon status, and attach the popupDiv to it. Use a util function to return a new MarkerIcon with the correct url
        const marker = L.marker([lat, lng], {icon: produceIconUrl(status)}).addTo(map).bindPopup(popupDiv)

        //select the select div inside the current popupdiv
        const selectedElement = popupDiv.querySelector("select")

        //add an event listener to this select element
        selectedElement.addEventListener("change", async function(){

            //update the value of residency.status to the current value selected by the user 
            residency.status = this.value

            //update the icon type based on the user selection
            marker.setIcon(produceIconUrl(this.value))

            //log on the browser which program has been updated and to what status
            console.log(`${popUpTitle}'s status has been changed to ${this.value}`)

            //send a request to the server to update the data with the new status.
            try{
                //send a patch request as json containing the new status and the program title to the server
                await fetch("http://localhost:8000/api", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        popUpTitle: popUpTitle,
                        status: this.value
                    })
                })
            }catch(err){
                console.log(err)
            }            
        })

    }

    )
}catch(err){
    console.log(err + "could not get residency data from the server")
}



//just need to send the response back to the server now