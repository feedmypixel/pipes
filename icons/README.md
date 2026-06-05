# Icons

Chrome expects PNG icons at 16, 32, 48 and 128 px. Drop these in here:

- `icon-16.png`
- `icon-32.png`
- `icon-48.png`
- `icon-128.png`

Until you add them, Chrome will fall back to a default icon — the extension
still loads fine without them, you'll just see a generic puzzle-piece.

A quick way to generate the set from a single 128px source:

```bash
for s in 16 32 48; do sips -z $s $s icon-128.png --out icon-$s.png; done
```
