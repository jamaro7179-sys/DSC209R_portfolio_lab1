// World map of CO2 emissions: countries shaded red by emissions, filterable by industry and year.
// Needs: d3, topojson-client, and emissions-data.js (defines EMISSIONS).

const WORLD = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
const { years, countries: countryNames, industries, rows } = EMISSIONS;

// dataset country name -> map country name (only where they differ)
const alias = {
  "China, People's Republic of": "China", "Korea, Republic of": "South Korea", "Russian Federation": "Russia",
  "United States": "United States of America", "Türkiye, Republic of": "Turkey", "Czech Republic": "Czechia",
  "Slovak Republic": "Slovakia", "Netherlands, The": "Netherlands", "Taiwan Province of China": "Taiwan",
  "Hong Kong Special Administrative Region, People's Republic of China": "Hong Kong",
  "Lao People's Democratic Republic": "Laos", "Brunei Darussalam": "Brunei"
};
const mapName = name => alias[name] || name.replace(/, Republic of$/, "");

// data colors come from the CSS variables in emissions-map.css
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const LOW = cssVar("--low"), HIGH = cssVar("--high");

const svg = d3.select("#map");
const tip = d3.select("#tip");
const path = d3.geoPath(d3.geoNaturalEarth1().fitSize([960, 500], { type: "Sphere" }));

// industry dropdown
d3.select("#industry").selectAll("option")
  .data(["All industries", ...industries]).join("option").text(d => d);

// legend (gradient bar, bottom-left)
const grad = svg.append("defs").append("linearGradient").attr("id", "legend-grad");
grad.append("stop").attr("class", "low").attr("offset", "0%");
grad.append("stop").attr("class", "high").attr("offset", "100%");
svg.append("rect").attr("class", "legend-bar").attr("x", 20).attr("y", 462).attr("width", 160).attr("height", 10);
svg.append("text").attr("class", "legend-label").attr("x", 20).attr("y", 487).text("0");
const legendMax = svg.append("text").attr("class", "legend-label").attr("x", 180).attr("y", 487).attr("text-anchor", "end");

d3.json(WORLD).then(world => {
  const shapes = topojson.feature(world, world.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
  const shapeNames = new Set(shapes.map(f => f.properties.name));

  const land = svg.append("g").selectAll("path").data(shapes).join("path")
    .attr("class", "land").attr("d", path);

  let valueByShape = new Map();   // map country name -> {name, value} for the current selection
  land.on("mousemove", (e, d) => {
      const hit = valueByShape.get(d.properties.name);
      if (!hit) return tip.style("opacity", 0);
      tip.style("opacity", 1).style("left", e.pageX + 12 + "px").style("top", e.pageY - 10 + "px")
        .html(`<b>${hit.name}</b><br>CO2 emissions: ${d3.format(",.1f")(hit.value)}`);
    })
    .on("mouseout", () => tip.style("opacity", 0));

  // total emissions per country (by country index) for one industry and year index
  function totalsFor(industry, yi) {
    const totals = new Map();
    for (const [c, i, values] of rows) {
      if (industry === "All industries" || industries[i] === industry) {
        totals.set(c, (totals.get(c) || 0) + values[yi]);
      }
    }
    return totals;
  }

  function update() {
    const industry = d3.select("#industry").property("value");
    const year = +d3.select("#year").property("value");
    const yi = years.indexOf(year);

    const totals = totalsFor(industry, yi);
    valueByShape = new Map();
    for (const [c, value] of totals) {
      const name = countryNames[c];
      if (!shapeNames.has(mapName(name))) console.warn("no map shape for", name);
      else valueByShape.set(mapName(name), { name, value });
    }

    // one scale per industry, fixed across all years, so the year slider shows change over time
    const max = d3.max(years, (_, y) => d3.max(totalsFor(industry, y).values()));
    const color = d3.scaleSequentialSqrt(d3.interpolateRgb(LOW, HIGH)).domain([0, max]);

    // countries with data get a color; null falls back to the CSS "no data" grey
    land.transition().duration(500)
      .style("fill", d => valueByShape.has(d.properties.name) ? color(valueByShape.get(d.properties.name).value) : null);

    legendMax.text(d3.format(",.0f")(max));
    d3.select("#yv").text(year);
  }

  d3.selectAll("#industry, #year").on("input", update);
  update();
});
