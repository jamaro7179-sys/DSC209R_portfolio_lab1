# CO2 Emissions Map (D3)

A world map that shades each country red by its CO2 emissions. Filter by **industry** (dropdown) and **year** (slider, 1995-2018). Hover a country for its value.

Open `emissions-map.html` in a browser (double-click works; it needs an internet connection for the map outlines).

## Files

| File | Purpose |
|---|---|
| `emissions-map.html` | Page structure: title, controls, the empty `<svg id="map">`, the tooltip `<div>` |
| `emissions-map.css` | All static styling and the color variables (`--low`, `--high`, `--no-data`, ...) |
| `emissions-map.js` | All the logic (documented below, and commented line-by-line in the file) |
| `emissions-data.js` | The data. Defines one global, `EMISSIONS` (shape below) |
| `CO2_emissions.csv` | Original IMF dataset. **Not read by the page**; `emissions-data.js` was built from it |

Keep the four `emissions-map.*` / `emissions-data.js` files in the same folder.

## Libraries

Loaded by `<script>` tags in `emissions-map.html`, before `emissions-map.js`.

| Library | Global | What it does here |
|---|---|---|
| **D3 v7** (d3js.org) | `d3` | Everything below |
| `d3-selection` | | `d3.select`, `selectAll`, `.data().join()`, `.attr()`, `.style()`, `.on()`: find elements, bind data, update them |
| `d3-fetch` | | `d3.json()`: downloads the map outlines |
| `d3-geo` | | `d3.geoNaturalEarth1` (projection), `d3.geoPath`: turns country shapes into SVG paths |
| `d3-scale` | | `d3.scaleSequentialSqrt`: value -> position on the color ramp |
| `d3-interpolate` | | `d3.interpolateRgb`: blends between the LOW and HIGH colors |
| `d3-array` | | `d3.max`: largest value in a list |
| `d3-format` | | `d3.format`: readable numbers (e.g. 9,424) |
| `d3-transition` | | `.transition().duration(500)`: animated color changes |
| **topojson-client** | `topojson` | Converts the compact TopoJSON map file into GeoJSON features D3 can draw |
| **world-atlas** (data, not code) | | `countries-50m.json` country outlines, fetched from the jsDelivr CDN at runtime. The smaller 110m version drops tiny countries (Singapore, Malta) that are in our dataset |

**Possible additions later:** `d3-zoom` (zoom/pan, already in the D3 bundle), `d3-scale-chromatic` (ready-made color ramps, also in the bundle), `d3-geo-projection` (more projections), Observable Plot (shorter chart API), Leaflet/MapLibre (tiled street-map background).

## Data shape (`emissions-data.js`)

```js
const EMISSIONS = {
  years:      [1995, ... 2018],                   // 24 years
  countries:  ["Austria", "Belgium", ...],        // 66 names, sorted
  industries: ["Accommodation and food services", ...],   // 45 names, sorted
  rows: [ [countryIndex, industryIndex, [v1995, ... v2018]], ... ]   // 2,970 rows
};
```

One row = one country + one industry, with one value per year (same order as `years`). Values are "CO2 emissions, Metric ton of CO2" from the IMF dataset. The CSV also holds multipliers and intensities; those are **not** emissions totals, so they were left out. Names are stored as indexes into the two lists to keep the file small (about 380 KB).

## What each function / section does (`emissions-map.js`)

- **`mapName(name)`**: converts a dataset country name to the map's spelling. Checks the `alias` table first (e.g. "Korea, Republic of" -> "South Korea"), otherwise strips a trailing ", Republic of". If a country ever has no shape, the browser console says `no map shape for <name>`; add it to `alias`.
- **`cssVar(name)`**: reads a CSS variable from `emissions-map.css`. Lets the colors live in one place (the CSS) while the D3 color scale still uses them.
- **Projection + `path`**: `geoNaturalEarth1().fitSize([960, 500], {type: "Sphere"})` flattens the globe to fit the 960x500 SVG; `d3.geoPath(...)` turns each country outline into SVG path text.
- **Dropdown setup**: `.data(["All industries", ...industries]).join("option")` creates one `<option>` per industry.
- **Legend**: a gradient bar (colors come from CSS) with "0" on the left; the right label is the current maximum, filled in by `update()`.
- **`d3.json(WORLD).then(...)`**: waits for the map outlines, then does everything below. Antarctica is filtered out (no data, crowds the legend). Each country is drawn once as a `<path class="land">`.
- **Hover (`mousemove` / `mouseout`)**: shows a tooltip with the country name and value; hides it for countries with no data.
- **`totalsFor(industry, yi)`**: sums emissions for one industry choice ("All industries" adds everything) in one year (`yi` = year index, 0 = 1995). Returns a Map of country index -> total.
- **`update()`**: the main function. Runs at startup and whenever a control changes. Reads the industry and year, builds the per-country values, builds the color scale, recolors the countries (animated), and updates the legend maximum and the year label.
- **Wiring**: `d3.selectAll("#industry, #year").on("input", update)` makes the map update live as you drag the slider, then `update()` draws the starting view (All industries, 2018).

## Design notes

- **Color scale is fixed across years** for the selected industry (its maximum over all years), so the year slider shows real change over time (1995 is dimmer than 2018). It rescales when you change industry, because industries differ hugely in size, so brightness can't be compared *between* industries.
- **Sqrt color scale** keeps mid-size countries visible next to giants like China.
- **Fill uses `.style("fill")`, not `.attr("fill")`**, because a CSS rule would override an attribute. `null` removes the inline style so the CSS grey ("no data") shows.
- **Why `emissions-data.js` instead of reading the CSV**: browsers block a page opened by double-click from reading a local CSV, so the data is pre-summarized into a script file.
