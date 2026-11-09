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

function renderScatterPlot(data, commits) {
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
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue');

}


let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
