import http from "node:http"
import { sendResponse } from "./utils/sendResponse.js"
import path from "node:path"
import fs from "node:fs/promises"

const PORT = 8000


const server = http.createServer( async(req, res) => {

    if(req.url.startsWith("/api")){
        if(req.method === "GET"){
            try{
                //wait to read the data from residencies.json into a variable called content
                const content = await fs.readFile(path.join("data", "residencies.json"))
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

//all the files have been served. what now? do i try adding the map? I think so. i could practice with dummy data, and then work on using real json data or something