import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale;
let yScale;


async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];

        let {author, date, time, timezone, datetime} = first;

        let ret = {
            id: commit,
            url: 'https://github.com/jamaro7179-sys/DSC209R_portfolio_lab1/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            //for time analysis
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            //for seeing how many lines were modified
            totalLines: lines.length,
            //seeing how many files were touched
            filesAffected: new Set(lines.map(d => d.file)).size,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            configurable: true,
            writable: true,
            enumerable: false,
        });
        return ret;
    })
    .sort((a, b) => a.datetime - b.datetime);
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }

    const lines = selectedCommits.flatMap((d) => d.lines);

    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

    container.innerHTML = '';
    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);
        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

function renderCommitInfo(data, commits) {
    // Create dl
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total LOC
    dl.append('dt').html('Total Lines of Code:');
    dl.append('dd').text(data.length);

    // Add total commits
    dl.append('dt').html('Total commits:');
    dl.append('dd').text(commits.length);

    // Add total authors
    dl.append('dt').text('Total authors:');
    dl.append('dd').text(new Set(commits.map(d => d.author)).size);

    // Add total files affected
    dl.append('dt').text('Total files affected:');
    dl.append('dd').text(new Set(data.map(d => d.file)).size);

    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'long' }),
    );

    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

    // Most productive time of the day
    dl.append('dt').text('Most productive time of the day:');
    dl.append('dd').text(maxPeriod);

    const workByDay = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' }),
    );

    const mostProductiveDayOfWeek = d3.greatest(workByDay, (d) => d[1])?.[0];

    // Most productive day of the week
    dl.append('dt').text('Most productive day of the week:');
    dl.append('dd').text(mostProductiveDayOfWeek);
}

function renderTooltipContent(commit) {
    const link = document.getElementById('tooltip-link');
    const author = document.getElementById('tooltip-author');
    const date = document.getElementById('tooltip-date');
    const time = document.getElementById('tooltip-time');
    const lines = document.getElementById('tooltip-lines');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    author.textContent = commit.author;
    date.textContent = commit.datetime.toLocaleString('en', { dateStyle: 'full' });
    time.textContent = commit.datetime.toLocaleString('en', { timeStyle: 'short' });
    lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.style.left = `${event.clientX + 10}px`;
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
}

function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderScatterPlot(data, commits) {

    //Sort commits by total lines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const width = 1200;
    const height = 600;
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    const dots = svg
        .append('g')
        .attr('class', 'dots');

    const margins = {
        top: 10,
        right: 10,
        bottom: 30,
        left: 20,
    };

    const usableArea = {
        top: margins.top,
        right: width - margins.right,
        bottom: height - margins.bottom,
        left: margins.left,
        width: width - margins.left - margins.right,
        height: height - margins.top - margins.bottom,
    };

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([5, 15]);

    const xAxis = d3
        .axisBottom(xScale)
        .ticks(d3.timeWeek)
        .tickFormat(d3.timeFormat('%b %d'));

    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    //X-axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    //Y-axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);


    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id) ///change made Lab 8 1.3
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(commit);
            updateTooltipPosition(event);
            updateTooltipVisibility(true);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    // Create brush
    svg.call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();

    function brushed(event) {
        const selection = event.selection;
        d3.selectAll('circle').classed('selected', (d) =>
            isCommitSelected(selection, d));
        renderSelectionCount(selection);
        renderLanguageBreakdown(selection);
    }
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

let commitProgress = 100;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

const slider = document.getElementById('commit-progress');
const timeDisplay = document.getElementById('commit-time');

// Will get updated as user changes slider
let filteredCommits = commits;

function onTimeSliderChange() {
  commitProgress = Number(slider.value);
  commitMaxTime = timeScale.invert(commitProgress);
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

let colors = d3.scaleOrdinal(d3.schemeTableau10);

function updateFileDisplay(filteredCommits) {
  let lines = filteredCommits.flatMap((d) => d.lines);

  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      }),
    );

  // This code updates the div info
  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

slider.addEventListener('input', onTimeSliderChange);
onTimeSliderChange(); // run once so the time shows on page load

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
  
    const svg = d3.select('#chart').select('svg');
  
  
    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));
  
  
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
  
    const xAxis = d3.axisBottom(xScale);
  
  
    // clear out the existing x-axis and redraw it
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);
  
  
    const dots = svg.select('g.dots');
  
  
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
      .selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7) // Add transparency for overlapping dots
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
}

// ---- Step 3.2: commit story text ----
d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

// ---- Step 3.3: update the plot as the user scrolls ----
function onStepEnter(response) {
  const commit = response.element.__data__;

  commitMaxTime = commit.datetime;
  commitProgress = timeScale(commitMaxTime);
  slider.value = commitProgress;
  timeDisplay.textContent = commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  updateScatterPlot(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);
