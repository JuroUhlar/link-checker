# Documentation link checker 

Internal utilities for checking for broken links in our resources across documentation, GitHub and website.




## Motivation

There are obviously many libraries and services (we also use [TripleChecker.com](https://www.triplechecker.com/)) to check for broken links but I haven't found one that works well for documentation. They all just check the link's status code and call it a day.

But documentation often contains anchor links like [https://dev.fingerprint.com/docs/quick-start-guide#1-create-an-account](https://dev.fingerprint.com/docs/quick-start-guide#1-create-an-account) that point to specific section of our or eternal documentation. Hash links break far more easily that normal links: sub-headlines can change over time and there is usually no redirect mechanism applied.

So a documentation link checker must parse the returned page and check that hash element actually exists on the page. This must also work for common edge cases like 
* Client-side rendered pages (a headless browser is needed).
* GitHub links pointing to specific lines in the code, like [https://github.com/fingerprintjs/fingerprintjs/blob/master/package.json#L3-L5](https://github.com/fingerprintjs/fingerprintjs/blob/master/package.json#L3-L5)



## To-do

[x] Combine artifact outputs
[x] Deploy to GitHub pages
[x] Enable Slack notifications
[ ] Move repository
[ ] Nice Readme 
[ ] Add tests for pages parsing, sitemap parsing
[ ] Copy link to clipboard
[ ] Github L{number} links still fail sometimes


## To-do later

[ ] Add more tests
[ ] Improve performance
[ ] Clean code
[ ] Reusable GitHub action
[ ] Publish on NPM?
[ ] Progress bard that works on GitHub actions
