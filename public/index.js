import { produceIconUrl } from "./produceIconUrl.js"

// Global variable to store residencies data
let residencies = [];

// Ranking utility functions
function getRankedPrograms() {
    return residencies
        .filter(r => r.status === "interview offered" && r.rank)
        .sort((a, b) => a.rank - b.rank);
}

function getMaxRank() {
    const rankedPrograms = getRankedPrograms();
    return rankedPrograms.length;
}

function getAvailableRanks() {
    const maxRank = getMaxRank();
    const availableRanks = [];
    for (let i = 1; i <= maxRank + 1; i++) {
        availableRanks.push(i);
    }
    return availableRanks;
}

function pushDownRanks(newRank) {
    residencies.forEach(residency => {
        if (residency.status === "interview offered" && residency.rank && residency.rank >= newRank) {
            residency.rank += 1;
        }
    });
}

function pullUpRanks(removedRank) {
    residencies.forEach(residency => {
        if (residency.status === "interview offered" && residency.rank && residency.rank > removedRank) {
            residency.rank -= 1;
        }
    });
}

async function assignRank(popUpTitle, newRank) {
    const program = residencies.find(r => r.popUpTitle === popUpTitle);
    
    if (program) {
        // If program already has a rank, remove it first
        if (program.rank) {
            pullUpRanks(program.rank);
        }
        
        // Push down existing ranks at the new position
        pushDownRanks(newRank);
        
        // Assign new rank
        program.rank = newRank;
        
        // Update server
        await updateRankOnServer(popUpTitle, newRank);
        
        // Update all popups and table
        updateAllPopups();
        updateRankingTable();
    }
}

async function unrankProgram(popUpTitle) {
    const program = residencies.find(r => r.popUpTitle === popUpTitle);
    
    if (program && program.rank) {
        const removedRank = program.rank;
        
        // Remove rank
        program.rank = null;
        
        // Pull up higher ranks
        pullUpRanks(removedRank);
        
        // Update server
        await updateRankOnServer(popUpTitle, null);
        
        // Update all popups and table
        updateAllPopups();
        updateRankingTable();
    }
}

function createPopupContent(residency) {
    const { popUpTitle, status, rank, note } = residency;
    
    let popupHTML = `
        <b>${popUpTitle}</b>
        <br><br>
    `;
    
    // Add note information if it exists
    if (note) {
        // Convert newlines to <br> tags and escape any HTML
        const formattedNote = note
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        
        popupHTML += `
            <div style="background-color: #f5f5f5; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 12px; max-height: 150px; overflow-y: auto;">
                ${formattedNote}
            </div>
        `;
    }
    
    popupHTML += `
        <select class="status-select">
            <option value="applied" ${status === "applied" ? "selected" : ""}>Applied</option>
            <option value="interview offered" ${status === "interview offered" ? "selected" : ""}>Interview Offered</option>
            <option value="rejected" ${status === "rejected" ? "selected" : ""}>Declined</option>
        </select>
    `;
    
    // Add ranking section for "interview offered" status
    if (status === "interview offered") {
        const availableRanks = getAvailableRanks();
        
        popupHTML += `<br><br>`;
        
        if (rank) {
            popupHTML += `
                <div style="color: #2e7d32; font-weight: bold;">
                    Ranked: #${rank}
                </div>
                <button class="unrank-btn" style="margin-top: 5px; padding: 4px 8px; background-color: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    Unrank Program
                </button>
            `;
        } else {
            popupHTML += `
                <label>Assign Rank: 
                    <select class="rank-select" style="margin-left: 5px;">
                        <option value="">Choose rank...</option>
                        ${availableRanks.map(r => `<option value="${r}">#${r}</option>`).join('')}
                    </select>
                </label>
            `;
        }
    }
    
    return popupHTML;
}

function addPopupEventListeners(residency) {
    const { popupDiv, popUpTitle } = residency;
    
    // Status change listener
    const statusSelect = popupDiv.querySelector(".status-select");
    if (statusSelect) {
        statusSelect.addEventListener("change", async function() {
            const newStatus = this.value;
            
            // If changing away from "interview offered", remove rank
            if (residency.status === "interview offered" && newStatus !== "interview offered" && residency.rank) {
                await unrankProgram(popUpTitle);
            }
            
            // Update status
            residency.status = newStatus;
            
            // Update icon
            residency.marker.setIcon(produceIconUrl(newStatus));
            
            // Update popup content
            popupDiv.innerHTML = createPopupContent(residency);
            addPopupEventListeners(residency); // Re-add listeners
            
            // Update server
            try {
                await fetch("/api", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        popUpTitle: popUpTitle,
                        status: newStatus
                    })
                });
            } catch(err) {
                console.log(err);
            }
            
            // Update ranking table
            updateRankingTable();
            
            console.log(`${popUpTitle}'s status has been changed to ${newStatus}`);
        });
    }
    
    // Rank selection listener
    const rankSelect = popupDiv.querySelector(".rank-select");
    if (rankSelect) {
        rankSelect.addEventListener("change", async function() {
            const newRank = parseInt(this.value);
            if (newRank) {
                await assignRank(popUpTitle, newRank);
            }
        });
    }
    
    // Unrank button listener
    const unrankBtn = popupDiv.querySelector(".unrank-btn");
    if (unrankBtn) {
        unrankBtn.addEventListener("click", async function() {
            await unrankProgram(popUpTitle);
        });
    }
}

function updateAllPopups() {
    residencies.forEach(residency => {
        if (residency.popupDiv) {
            residency.popupDiv.innerHTML = createPopupContent(residency);
            addPopupEventListeners(residency);
        }
    });
}

function updateRankingTable() {
    const rankedPrograms = getRankedPrograms();
    
    const tableBody = document.getElementById('ranking-table-body');
    const table = document.getElementById('ranking-table');
    const info = document.getElementById('ranking-info');
    
    if (rankedPrograms.length === 0) {
        table.style.display = 'none';
        info.textContent = 'Programs with "interview offered" status and ranks will appear here.';
        return;
    }
    
    table.style.display = 'table';
    info.textContent = `You have ${rankedPrograms.length} programs ranked:`;
    
    tableBody.innerHTML = rankedPrograms.map(program => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
                #${program.rank}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px;">${program.popUpTitle}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${program.city}, ${program.state}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                <button onclick="focusOnProgram('${program.popUpTitle}')" 
                        style="padding: 4px 8px; cursor: pointer; margin-right: 5px;">
                    View on Map
                </button>
                <button onclick="unrankFromTable('${program.popUpTitle}')" 
                        style="padding: 4px 8px; cursor: pointer; background-color: #f44336; color: white; border: none; border-radius: 3px;">
                    Unrank
                </button>
            </td>
        </tr>
    `).join('');
}

// Function to focus on a program on the map
function focusOnProgram(popUpTitle) {
    const program = residencies.find(r => r.popUpTitle === popUpTitle);
    if (program) {
        map.setView([program.lat, program.lng], 10);
        program.marker.openPopup();
    }
}

// Function to unrank from table
async function unrankFromTable(popUpTitle) {
    await unrankProgram(popUpTitle);
}

async function updateRankOnServer(popUpTitle, rank) {
    try {
        await fetch("/api", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                popUpTitle: popUpTitle,
                rank: rank
            })
        });
    } catch(err) {
        console.log(err);
    }
}

// Make functions globally available
window.focusOnProgram = focusOnProgram;
window.unrankFromTable = unrankFromTable;

const map = L.map('map').setView([40, -100], 4)

L.tileLayer(
    ('https://tile.openstreetmap.org/{z}/{x}/{y}.png'),
    {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map)

// Create marker cluster group with custom options
const markerClusterGroup = L.markerClusterGroup({
    // Show clusters at zoom levels where markers are close
    disableClusteringAtZoom: 12,
    // Custom cluster icon creation
    iconCreateFunction: function(cluster) {
        const childCount = cluster.getChildCount();
        let className = 'marker-cluster-';
        
        if (childCount < 5) {
            className += 'small';
        } else if (childCount < 10) {
            className += 'medium';
        } else {
            className += 'large';
        }
        
        return new L.DivIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster ' + className,
            iconSize: new L.Point(40, 40)
        });
    },
    // Spider out markers when cluster is clicked
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    // Custom spider effect
    spiderfyDistanceMultiplier: 2,
    maxClusterRadius: 50
});

// Add custom hover effects for clusters
markerClusterGroup.on('clustermouseover', function (a) {
    // You can add custom hover effects here if needed
    a.layer.setOpacity(0.8);
});

markerClusterGroup.on('clustermouseout', function (a) {
    a.layer.setOpacity(1);
});

// Handle cluster clicks to show spider effect
markerClusterGroup.on('clusterclick', function (a) {
    // The spider effect is automatic, but you can add custom behavior here
    console.log('Cluster with ' + a.layer.getChildCount() + ' markers clicked');
});

// Add the cluster group to the map
map.addLayer(markerClusterGroup);

//wait for the file to fetch the data from the server
try{
    const response = await fetch("/api")
    residencies = await response.json()

    // After loading residencies, create markers and add them to the cluster group
    //loop through each residency object in the array of residencies
    residencies.forEach(residency => {

        //deconstruct the properties from residency that you are going to use
        const {popUpTitle, status, lat, lng} = residency

        //create a div element
        const popupDiv = document.createElement("div")
        
        // Set initial popup content using new function
        popupDiv.innerHTML = createPopupContent(residency);

        //create a marker on the map for the given residency program's coordinates and icon status, and attach the popupDiv to it. Use a util function to return a new MarkerIcon with the correct url
        const marker = L.marker([lat, lng], {icon: produceIconUrl(status)}).bindPopup(popupDiv)
        
        // Add marker to cluster group instead of directly to map
        markerClusterGroup.addLayer(marker);
        
        // Store references for later updates
        residency.marker = marker;
        residency.popupDiv = popupDiv;

        // Add event listeners using new function
        addPopupEventListeners(residency);

    });
    
    // Auto-fit map bounds to show all markers
    if (residencies.length > 0) {
        // Get bounds of all markers in the cluster group
        const group = new L.featureGroup();
        residencies.forEach(residency => {
            group.addLayer(L.marker([residency.lat, residency.lng]));
        });
        
        // Fit map to bounds with some padding
        map.fitBounds(group.getBounds(), {
            padding: [20, 20] // Add 20px padding around the bounds
        });
    }
    
    // Initialize ranking table
    updateRankingTable();

}catch(err){
    console.log(err + "could not get residency data from the server")
}



//so now, i need someway of adding a Rank input field to the popup only if the status of that program is "Interview Offered". the user can select a bunch of numbers from a dropdown. but the range has to be the length of the array of ranked programs + 1. And if a program is assigned an existing rank, all programs ranked at that value and greater need to get push back by 1. when a program gets assigned a rank, it needs to display that information in the corresponding popup, and in a table below the map. Furthermore, there needs to be an unrank button that appears in each popup only after a rank has been assigned that allows the user to unassign a rank, in which case every program assigned a greater rank will be pulled up by 1. 