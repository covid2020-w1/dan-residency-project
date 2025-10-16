import { produceIconUrl } from "./produceIconUrl.js"

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
    const response = await fetch("/api")
    const residencies = await response.json()

    // After loading residencies, before creating markers
    //  creates an empty object for storing diff groups of programs that share the same coordinates
    const coordinateGroups = {};
    //for reach program...
    residencies.forEach((residency, index) => {
        //... set each coordinate equal to var key
        const key = `${residency.lat},${residency.lng}`;
        //if a coordinate property of coordinateGroups object does not exist, initialize a new property with the name of that coordinate and set it equal to an empty array
        if (!coordinateGroups[key]) {
            coordinateGroups[key] = [];
        }
        //add each program and its index in the array to the object property whose name is equal to the coordinates
        coordinateGroups[key].push({residency, index});
    });

    // Apply offsets to duplicates. Convert the properties of coordinateGroups into an array, where for each group...
    Object.values(coordinateGroups).forEach(group => {
        //...only if the group length is greater than 1...
        if (group.length > 1) {
            //for each program in the group, 
            group.forEach((item, i) => {
                // divide the degrees of a circle by the amount of programs in a given group
                const angle = (i / group.length) * 2 * Math.PI;
                //set a factor by how much you want to separate the similar pins
                const offsetDistance = 0.01; // Adjust as needed
                //increment the latitude and longitude by that amount
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
            <br>
            <br>
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
                await fetch("/api", {
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



//so now, i need someway of adding a Rank input field to the popup only if the status of that program is "Interview Offered". the user can select a bunch of numbers from a dropdown. but the range has to be the length of the array of ranked programs + 1. And if a program is assigned an existing rank, all programs ranked at that value and greater need to get push back by 1. when a program gets assigned a rank, it needs to display that information in the corresponding popup, and in a table below the map. Furthermore, there needs to be an unrank button that appears in each popup only after a rank has been assigned that allows the user to unassign a rank, in which case every program assigned a greater rank will be pulled up by 1. 