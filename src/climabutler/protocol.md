```
1111 1111 111111 111111 111111 11111111 1  111 111111 1111 1111
52   48   44     38     32     26       18 17  14     8    4   0
```

| Field | Bits | Num Bits | Description | Retrieval |
| :--- | :--- | :--- | :--- | :--- |
| Unknown | 51..48 | 4 | Fixed to `1000` | |
| Power State | 47..44 | 4 | `0000` = OFF, `0011` = ON | `((data >> 44) & 0xF) == 0x3` |
| Off Timer State | 43 | 1 | State of the off timer | `(data >> 43) & 0x1` |
| Off Timer Value | 42..38 | 5 | Off timer value (0–31) | `(data >> 38) & 0x1F` |
| Unknown | 37..32 | 6 | Fixed to `000000` | |
| On Timer State | 31 | 1 | State of the on timer | `(data >> 31) & 0x1` |
| On Timer Value | 30..26 | 5 | On timer value (0–31) | `(data >> 26) & 0x1F` |
| Unknown | 25..18 | 8 | Fixed to `00000001` | |
| Swing | 17 | 1 | Swing mode flag | `(data >> 17) & 0x1` |
| Unknown | 16..14 | 3 | Fixed to `110` | |
| Mode | 13..8 | 6 | 6‑bit mode value | `(data >> 8) & 0x3F` |
| Temperature | 7..4 | 4 | Temperature value | `((data >> 4) & 0xF) + 16` |
| Integrity | 3..0 | 4 | 4‑bit integrity / checksum | `data & 0xF` |

**Notes:**
- The remote doesn't let you go beyond 30 °C (`1110`) temperature, you can set it to 31 °C (`1111`) though, the AC will recognize it.
- The remote wraps back to 0 when incrementing the timer from 23, but the AC accepts up to 31.
- Timer values without their state set to `1` will do essentially nothing.
- Off timer when the device is off does nothing.
- On timer when the device is on does nothing.
- While the remote never does this, it is possible to set the state of a timer to `1` while setting a timer value = 0 (`00000`). From my testing, the device will say 00 on its display and turn off after around 1 minute.
- Mode can only be one of 6 values, see [MODES enum](./types.ts).
- Checksum is the ones complement of the sum of the first 12 nibbles.
- Unknown means the remote does not use it.