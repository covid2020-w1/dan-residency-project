export function produceIconUrl(status){

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

    if(status === "applied"){
        return new MarkerIcon({iconUrl: "images/pin-applied.png"})
    }else if(status === "rejected"){
        return new MarkerIcon({iconUrl: "images/pin-rejected.png"})
    }else if(status === "interview offered"){
        return new MarkerIcon({iconUrl: "images/pin-interviewOffered.png"})
    }

}

