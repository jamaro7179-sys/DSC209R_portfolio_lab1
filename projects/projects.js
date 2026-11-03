import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// update the projects title to include the number of projects
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcgenerator = d3.arc().innerRadius(0).outerRadius(50);

let data = [1, 2];
let total = 0;

for (let d of data) {
    total += d;
}

let angle = 0;
let arcData = [];

for (let d of data) {
    let endAngle = angle + (d / total) * Math.PI * 2;
    arcData.push({
        startAngle: angle,
        endAngle: endAngle,
    });
    angle = endAngle;
}

let arcs = arcData.map(d => arcgenerator(d));
let colors = ['gold', 'purple'];

arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors[idx]);
})