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

let data = await loadData();
let commits = processCommits(data);
console.log(commits);