export function sendResponse(res, status, contentType, content){
    res.statusCode = status;
    res.setHeader("ContentType", contentType)
    res.end(content)
}