# link-checker (Work in progress)

My utility for checking broken links, including #anchors

## To-do

[x] Implement a promise pool to speed up the checks without causing network errors, https://www.npmjs.com/package/@supercharge/promise-pool looks like the best choice
[x] Playwright to check hashes in client rendered sites
[x] Filter mailto links
[x] Accept redirects
[ ] Get page links using Playwright to get email addresses
[ ] Read sitemap index
[ ] Include errors in results
[ ]
