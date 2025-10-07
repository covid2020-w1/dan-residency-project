export function sendResponse(res, status, contentType, content){
    res.statusCode = status;
    res.setHeader("Content-Type", contentType)
    res.end(content)
}