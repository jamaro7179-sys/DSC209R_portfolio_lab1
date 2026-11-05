# CO2 Emissions Map (D3)

World map shading each country red by its CO2 emissions. Filter by **industry** (dropdown) and **year** (slider, 1995-2018); hover a country for its value.

## Run it
Serve the folder (VS Code Live Server or GitHub Pages) and open `emissions-map.html`. Double-clicking won't work because browsers block local CSV reads. Needs internet for the map outlines.

## Files
- `emissions-map.html`: page structure (title, controls, map `<svg>`, tooltip)
- `emissions-map.css`: styling and the color variables (`--low`, `--high`, `--no-data`)
- `emissions-map.js`: all the logic
- `CO2_emissions.csv`: IMF data; must sit next to the page

## Libraries
- **D3 v7**: draws the map, scales colors, loads the files
- **topojson-client**: converts the map file into shapes D3 can draw
- **world-atlas** (data only): country outlines, fetched from the jsDelivr CDN

## How `emissions-map.js` works
- `mapName`: matches dataset country names to the map's spelling (add odd ones to `alias`)
- `cssVar`: reads the map colors from the CSS file
- `totalsFor(industry, year)`: adds up emissions per country
- `update()`: reads the controls, then recolors the map, legend and year label
- The color scale is fixed across years for the chosen industry, so the slider shows change over time. It resets per industry, so brightness can't be compared between industries.
