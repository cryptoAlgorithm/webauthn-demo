// Create shields.io badge for code coverage stat
const fs = require('fs')
const {makeBadge} = require('badge-maker')

// Create coverage badge
const covSummary = require('../coverage/coverage-summary.json')
const covPct = covSummary.total.statements.pct

let color = 'green'
if (covPct < 20) color = 'red'
else if (covPct < 70) color = '#ffa500'  // orange_2

let covBadgeFile = process.argv[2] == null? "cov-badge.svg" : process.argv[2]
const covBadge = {
    label: 'coverage',
    message: covPct.toFixed(0) + '%',
    color: color
}
const covSvg = makeBadge(covBadge)
fs.writeFileSync(covBadgeFile, covSvg)

// Create badge for shields.io
// const covBadge = {
//     schemaVersion: 1,
//     label: 'coverage',
//     message: covPct.toFixed(0) + '%',
//     color: color
// }
// console.log("covBadge:", JSON.stringify(covBadge))
// fs.writeFileSync(process.argv[2], JSON.stringify(covBadge))

// Create test results badge
const testSummary = require('../test-results.json')
const numPassedTests = testSummary.numPassedTests
const numFailedTests = testSummary.numFailedTests
color = numPassedTests != 0 && numFailedTests == 0? 'green' : 'red'

let testBadgeFile = process.argv[3] == null? "test-badge.svg" : process.argv[3]
const testBadge = {
    label: 'tests',
    message: `${numPassedTests} passed, ${numFailedTests} failed`,
    color: color
}
const testSvg = makeBadge(testBadge)
fs.writeFileSync(testBadgeFile, testSvg)
console.log(`Created ${covBadgeFile} and ${testBadgeFile}`)






