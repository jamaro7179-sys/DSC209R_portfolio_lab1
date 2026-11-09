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

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);

