import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

// update the projects title to include the number of projects
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcgenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let query = '';
let selectedIndex = -1;



function renderPieChart(projectsGiven) {
    let svg = d3.select('#projects-pie-plot');
    let legend = d3.select('.legend');
  
    svg.selectAll('path').remove();
    legend.selectAll('li').remove();
  
    let rolledData = d3.rollups(projectsGiven, (v) => v.length, (d) => d.year);
    let data = rolledData.map(([year, count]) => ({ value: count, label: year }));
  
    let arcData = d3.pie().value((d) => d.value)(data);
    let arcs = arcData.map((d) => arcgenerator(d));
  
    arcs.forEach((arc, idx) => {
      svg.append('path')
        .attr('d', arc)
        .attr('style', `--color: ${colors(idx)}`)        
        .on('click', () => {
          selectedIndex = selectedIndex === idx ? -1 : idx;
  
          svg.selectAll('path')
            .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));
          legend.selectAll('li')
            .attr('class', (_, i) => (i === selectedIndex ? 'selected' : ''));
  
          if (selectedIndex === -1) {
            renderProjects(projectsGiven, projectsContainer, 'h2');
          } else {
            let year = data[selectedIndex].label;
            let byYear = projectsGiven.filter((p) => p.year === year);
            renderProjects(byYear, projectsContainer, 'h2');
          }
        });
    });
  
    data.forEach((d, idx) => {
      legend.append('li')
        .attr('style', `--color: ${colors(idx)}`)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
  }
  
renderPieChart(projects);
  
let searchInput = document.querySelector('.searchBar');
  
searchInput.addEventListener('input', (event) => {
    query = event.target.value; 
    selectedIndex = -1;
    let filteredProjects = projects.filter((project) => {
      let values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query.toLowerCase());
});
  
renderProjects(filteredProjects, projectsContainer, 'h2');
renderPieChart(filteredProjects);
});