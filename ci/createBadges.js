// Create badges for code coverage stat
const covSummary = require("../coverage/coverage-summary.json");
const covPct = covSummary.total.statements.pct

let color = 'green'
if (covPct <= 50) color = 'red'
else if (covPct <= 70) color = 'orange'

let covBadge = {
    schemaVersion: 1,
    label: 'coverage',
    message: covPct.toString(),
    color: color
}

console.log("covBadge:", JSON.stringify(covBadge))

const fs = require('fs');
fs.writeFileSync(process.argv[2], JSON.stringify(covBadge))
