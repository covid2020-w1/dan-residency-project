import http from "node:http"
import { sendResponse } from "./utils/sendResponse.js"
import path from "node:path"
import fs from "node:fs/promises"

const PORT = 8000


const server = http.createServer( async(req, res) => {

    //handle any api fetch requests from the client
    if(req.url.startsWith("/api")){

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

        }
    
    //serve static 
    }else if(!req.url.startsWith("/api")){
        
        const __dirname = import.meta.dirname
        const pathToResource = path.join(
            __dirname, 
            "public",  
            req.url === "/" ? "index.html" : req.url
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