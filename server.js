import http from "node:http"
import { sendResponse } from "./utils/sendResponse.js"
import path from "node:path"
import fs from "node:fs/promises"

const PORT = 8000


const server = http.createServer( async(req, res) => {
    //now let's create a way for all the files to get served

    const __dirname = import.meta.dirname

    const pathToResource = path.join(
        __dirname, 
        "public",  
        req.url === "/" ? "index.html" : req.url)
        

    //now you just need to plug in pathToResource into path.extname() and create the getContentType function to serve static
    
    const ext = path.extname(pathToResource)

    const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".jpeg": "image/jpeg",
        ".jpg": "image/jpeg",
        ".png": "image/png",
    }

    const content = await fs.readFile(pathToResource)

    sendResponse(res, 200, contentTypes[ext], content)
})

server.listen(PORT, () => console.log(`Connected to port ${PORT}`))