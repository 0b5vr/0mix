### SVG

- Remove translation props from curves, usually can be done by applying union
- `svgo -p 0 image.svg`
- `<svg>`: perserve `viewBox` and `xmlns`, remove everything else
- `<d>`: edit fill and stroke
