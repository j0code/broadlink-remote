import ClimaButler from "./climabutler/ClimaButler.js"

const ac = new ClimaButler()

ac.power = true
ac.temperature = 20
await ac.send()
ac.close()