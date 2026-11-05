// World map of CO2 emissions by country, filterable by industry and year (D3 + topojson-client).

const WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const FILE = "CO2_emissions.csv";
const years = d3.range(1995, 2019);

// dataset country name -> map country name (only where they differ)
const alias = {
  "China, People's Republic of": "China", "Korea, Republic of": "South Korea", "Russian Federation": "Russia",
  "United States": "United States of America", "Türkiye, Republic of": "Turkey", "Czech Republic": "Czechia",
  "Slovak Republic": "Slovakia", "Netherlands, The": "Netherlands", "Taiwan Province of China": "Taiwan",
  "Hong Kong Special Administrative Region, People's Republic of China": "Hong Kong",
  "Lao People's Democratic Republic": "Laos", "Brunei Darussalam": "Brunei"
};
// Converts a dataset country name to the map's spelling.
const mapName = name => alias[name] || name.replace(/, Republic of$/, "");

// Reads a color variable (--low, --high) from emissions-map.css.
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const LOW = cssVar("--low"), HIGH = cssVar("--high");

const svg = d3.select("#map");
const tip = d3.select("#tip");


// Turns a country shape into an SVG path on the 960x500 map.
const path = d3.geoPath(d3.geoNaturalEarth1().fitSize([1000, 500], { type: "Sphere" }));

// Legend: gradient bar from the low color to the high color.
const grad = svg.append("defs").append("linearGradient").attr("id", "legend-grad");
grad.append("stop").attr("class", "low").attr("offset", "0%");
grad.append("stop").attr("class", "high").attr("offset", "100%");
svg.append("rect").attr("class", "legend-bar").attr("x", 20).attr("y", 462).attr("width", 160).attr("height", 10);
svg.append("text").attr("class", "legend-label").attr("x", 20).attr("y", 487).text("0");
const legendMax = svg.append("text").attr("class", "legend-label").attr("x", 180).attr("y", 487).attr("text-anchor", "end");

// Loads the map outlines and the CSV (emissions rows only), then draws the countries and hooks up the controls.
Promise.all([
  d3.json(WORLD),
  d3.csv(FILE, d => d.INDICATOR.startsWith("CO2 emissions, Metric") ? d : null)   // skip multiplier/intensity rows
]).then(([world, rows]) => {
  const shapes = topojson.feature(world, world.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
  const shapeNames = new Set(shapes.map(f => f.properties.name));

  // Fills the industry dropdown.
  const industries = [...new Set(rows.map(d => d.INDUSTRY))].sort();
  d3.select("#industry").selectAll("option")
    .data(["All industries", ...industries]).join("option").text(d => d);

  // Draws every country as a grey shape; update() colors the ones with data.
  const land = svg.append("g").selectAll("path").data(shapes).join("path")
    .attr("class", "land").attr("d", path);

  let valueByShape = new Map();   // map country name -> {name, value} for the current selection

  // Hover: shows the country's name and value in a tooltip.
  land.on("mousemove", (e, d) => {
      const hit = valueByShape.get(d.properties.name);
      if (!hit) return tip.style("opacity", 0);
      tip.style("opacity", 1).style("left", e.pageX + 12 + "px").style("top", e.pageY - 10 + "px")
        .html(`<b>${hit.name}</b><br>CO2 emissions: ${d3.format(",.1f")(hit.value)} metric tons`);
    })
    .on("mouseout", () => tip.style("opacity", 0));

  // Adds up emissions per country for one industry and one year.
  function totalsFor(industry, year) {
    const matching = rows.filter(d => industry === "All industries" || d.INDUSTRY === industry);
    return d3.rollup(matching, v => d3.sum(v, d => +d[year]), d => d.COUNTRY);
  }

  // Reads the dropdown and slider, then recolors the map, legend and year label.
  function update() {
    const industry = d3.select("#industry").property("value");
    const year = +d3.select("#year").property("value");

    valueByShape = new Map();
    for (const [name, value] of totalsFor(industry, year)) {
      if (!shapeNames.has(mapName(name))) console.warn("no map shape for", name);
      else valueByShape.set(mapName(name), { name, value });
    }

    // color scale fixed across all years (per industry) so the slider shows change over time
    const max = d3.max(years, y => d3.max(totalsFor(industry, y).values()));
    const color = d3.scaleSequentialSqrt(d3.interpolateRgb(LOW, HIGH)).domain([0, max]);

    // null falls back to the CSS "no data" grey
    land.transition().duration(500)
      .style("fill", d => valueByShape.has(d.properties.name) ? color(valueByShape.get(d.properties.name).value) : null);

    legendMax.text(d3.format(",.0f")(max));
    d3.select("#yv").text(year);
  }

  // Updates the map when a control changes, and draws the starting view.
  d3.selectAll("#industry, #year").on("input", update);
  update();
});
