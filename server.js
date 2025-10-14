import http from "node:http"
import { sendResponse } from "./utils/sendResponse.js"
import path from "node:path"
import fs from "node:fs/promises"
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const PORT = process.env.PORT || 8000
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


const server = http.createServer( async(req, res) => {

    const url = req.url || "/"

    //handle any api fetch requests from the client
    if(url.startsWith("/api")){

        //handle get requests
        if(req.method === "GET"){
            try{
                //wait to read the data from residencies.json into a variable called content
                const content = await fs.readFile(path.join("data", "residencies_with_coords.json"))
                //send the response
                sendResponse(res, 200, "application/json", content)
            }catch(err){
                if(err.code === "ENOENT"){
                    sendResponse(res, 404, "text/html", "<h1>404- File Not Found</h1>")
                }else if(err.code === "EACCES"){
                    sendResponse(res, 403, "text/html", "<h1>403- Restricted</h1>")
                }else{
                    sendResponse(res, 500, "text/html", "<h1> 500- Server error</h1>")
                }
            }

        //handle PATCH requests
        }else if(req.method === "PATCH"){

            let body = ""

            //gather the packets of the put request containing the new status and the program name
            try{
                for await (const chunk of req){
                    body += chunk
                }

                //the body arrives as a json string, so parse it into an object
                const parsedBody = JSON.parse(body)

                //get the existing residency data and save it
                const residenciesData = await fs.readFile(path.join("data", "residencies_with_coords.json"), "utf8")

                //the existing residency data arrives as a json string, so parse it into an object
                const parsedResidenciesData = JSON.parse(residenciesData)

                //save the index of the existing residency data where the popUpTitle of the program whose status has changed matches the popUpTitle of the entry in the existing data
                const targetIndex = parsedResidenciesData.findIndex(r => r.popUpTitle === parsedBody.popUpTitle)

                //onnly if the index can be matched, update the status of the program in the existing data 
                if(targetIndex !== -1){
                    parsedResidenciesData[targetIndex].status = parsedBody.status
                }

                //write the updated data to existing data's location
                await fs.writeFile(
                    path.join("data", "residencies_with_coords.json"),
                    JSON.stringify(parsedResidenciesData, null, 2),
                    "utf8"
                )

                //send a msg to the client telling them whether it's successful
                sendResponse(res, 200, "text/html", "success: true")

            }catch(err){
                console.log(err + ": server couldn't parse the json coming from the client")
            }
        }
    
    //serve static 
    }else if(!url.startsWith("/api")){
        
        const urlPath = req.url || "/"
        const pathToResource = path.join(
            __dirname, 
            "public",  
            urlPath === "/" ? "index.html" : urlPath
        )

        const ext = path.extname(pathToResource)

        const contentTypes = {
            ".css": "text/css",
            ".js": "text/javascript",
            ".json": "application/json",
            ".jpeg": "image/jpeg",
            ".jpg": "image/jpeg",
            ".png": "image/png",
        }

        const contentType = contentTypes[ext] || "text/html"

        try{
            const content = await fs.readFile(pathToResource)
            sendResponse(res, 200, contentType, content)
        }catch(err){
            console.error(err)

            if(err.code === "ENOENT"){
                sendResponse(res, 404, "text/html", "<h1> 404 Error- File not found</h1>")
            }else if(err.code === "EACCES"){
                sendResponse(res, 403, "text/html", "<h1>403 Error- Forbidden</h1>")
            }else{
                sendResponse(res, 500, "text/html", "<h1>Server error</h1>")
            }
            
        }
    }
    
})

server.listen(PORT, () => console.log(`Connected to port ${PORT}`))

//Then, focus on creating a dropdown html (i think select?) that lets the user POST data to the backend. Then, figure out how to display the data as a modal/side panel instead of a popup. Then, decide on whether you want to self-host with express.js or use supabase and set that up. Then figure out how you'll convert the json to a MySQL data table and plug that in to the front end. that's it.