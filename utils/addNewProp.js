import path from "node:path"
import fs from "node:fs/promises"

const pathToResource = path.join("data", "residencies_with_coords.json")

const content = await fs.readFile(pathToResource)
const programs = JSON.parse(content)

//now for each program, I want to add a new property

programs.forEach(program => {
    program.rank = null
})

await fs.writeFile(
    pathToResource,
    JSON.stringify(programs, null, 2),
    "utf8"
)
