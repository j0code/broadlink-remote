# broadlink-remote

Minimal utility for controlling devices via Broadlink RM Mini.

Currently supported:
- climabutler AC protocol

## Quick start

Install:
```bash
npx jsr add @j0code/broadlink-remote
```

## Using ClimaButler

### Example 1: turn the AC on and set a temperature

```ts
import ClimaButler from "@j0code/broadlink-remote/ClimaButler"

const ac = new ClimaButler()

ac.power = true
ac.temperature = 22
await ac.send()
ac.close()
```

### Example 2: set mode, swing, and a timer

```ts
import ClimaButler from "@j0code/broadlink-remote/ClimaButler"
import { MODES } from "@j0code/broadlink-remote/types.js"

const ac = new ClimaButler()

ac.power = true
ac.mode = MODES.cool_low
ac.temperature = 24
ac.swing = false
ac.offTimer = 2 // turn off after 2 hours
await ac.send()
ac.close()
```

## Notes

- `send()` transmits the current state to the Broadlink device.
- `close()` shuts down the connection when you are done.
- The available AC modes are exposed through `MODES` from the climabutler types.

## Contributing

Contributions are welcome. If you find a bug or want to improve the project, open an issue or submit a pull request.

## License

This project is licensed under the GPL-3.0-or-later license.
