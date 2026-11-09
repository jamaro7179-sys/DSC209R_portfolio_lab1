import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + 'T00:00' + row.timezone),
            datetime: new Date (row.datetime),
        
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
            enumerable: true,
        })
        return ret;
    });
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
    dl.append('dd').text(new Set(commits.map(d => d.filesAffected)).size);

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

    // Time of day work is done
    dl.append('dt').text('Most productive day of the week:');
    dl.append('dd').text(mostProductiveDayOfWeek);

}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const author = document.getElementById('author-name');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const lines = document.getElementById('commit-lines');

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

function renderScatterPlot(data, commits) {

    //Sort commits by total lines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    
    const width = 1000;
    const height = 600;
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    const xScale=d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    const yScale=d3
    .scaleLinear()
    .domain([0,24])
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
    .ticks(d3.timeWeek)  //I thought this would be better than the overlapping x-axis labels it was like when stock
    .tickFormat(d3.timeFormat('%b %d'));
    
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    //X-axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    //Y-axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipPosition(event);
      updateTooltipVisibility(true);
    })
    .on('mouseleave', () => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });


}




let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
