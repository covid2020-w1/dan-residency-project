import fs from "node:fs/promises"
import fetch from "node-fetch"

const API_KEY = "9cd88c87c9f57746c5ff7c6844489654dc88d64"
const INPUT_FILE = "./data/residencies.json"
const OUTPUT_FILE = "./data/residencies_with_coords.json"

async function geocodeCities(){

    try{
        const unparsedJson = await fs.readFile(INPUT_FILE, "utf8")
        const residencies = JSON.parse(unparsedJson)

        //for each object in the residencies array, we want to use the city/state properties to create the url we want for a fetch request to the geocodio api
        for (const residency of residencies){

            const location = `${residency.city}, ${residency.state}`
            const url = `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(location)}&api_key=${API_KEY}`

            try{
                const res = await fetch(url)
                const data = await res.json()

                if(data.results && data.results.length > 0){
                    const {lat, lng} = data.results[0].location

                    residency.lat = lat
                    residency.lng = lng
                    console.log(`✅ ${location} -> ${lat}, ${lng}`)
                }else{
                    console.warn(`Couldn't get location data for ${location}`)
                }

            }catch(err){
                console.error(`Problem connecting to geocodio api: ${err.message}`)
            }
        }
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(residencies, null, 2))
    }catch(err){
        console.error(`Problem reading or writing files: ${err.message}`)
    }

}

geocodeCities()