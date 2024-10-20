import { PromisePoolError } from "@supercharge/promise-pool";
import { Link, LinkWithResult } from "./types";
import ReactDOMServer from "react-dom/server";
import React from "react";
import { writeFileSync } from "fs";
import { StringLiteral } from "typescript";

type LinkCheckReport = ReturnType<typeof getJSONReport>;

type GetReportArgs = {
  links: LinkWithResult[];
  errors: PromisePoolError<Link>[];
  siteName: string;
};

export const getJSONReport = ({ links, errors, siteName }: GetReportArgs) => {
  const brokenLinks = links.filter((link) => link.result.ok === false && link.result.error === "broken link");
  const hashNotFound = links.filter((link) => link.result.ok === false && link.result.error === "hash not found");
  const couldNotCheck = links.filter((link) => link.result.ok === false && link.result.error === "could not check");
  const unexpectedErrors = [
    ...links.filter((link) => link.result.ok === false && link.result.error === "unexpected error"),
    ...errors.map(
      (error) =>
        ({
          ...error.item,
          result: { ok: false, error: "unexpected error", errorDetail: error.message },
        } satisfies LinkWithResult)
    ),
  ];

  return {
    siteName,
    summary: {
      linksChecked: links.length,
      totalLinksToFix: brokenLinks.length + hashNotFound.length + unexpectedErrors.length,
      brokenLinks: brokenLinks.length,
      hashNotFound: hashNotFound.length,
      networkErrors: unexpectedErrors.length,
      couldNotCheck: couldNotCheck.length,
    },
    brokenLinks,
    hashNotFound,
    networkErrors: unexpectedErrors,
    couldNotCheck,
  };
};

const LinkRenderer = ({ link }: { link: LinkWithResult }) => {
  const { href, text, page, result } = link;

  if (result.ok) {
    return (
      <span>
        [{text}]({href})
      </span>
    );
  }

  if (result.error === "hash not found") {
    const [baseUrl, hash] = href.split("#");
    return (
      <span>
        [{text}]({baseUrl}
        <span className="text-red-600">#{hash}</span>)
      </span>
    );
  } else
    return (
      <span className="text-red-600">
        [{text}]({href})
      </span>
    );
};

const JSONReportRenderer = ({ report }: { report: LinkCheckReport }) => {
  const allBrokenLinks = [
    ...report.brokenLinks,
    ...report.hashNotFound,
    ...report.networkErrors,
    ...report.couldNotCheck,
  ];
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Link Check Report for {report.siteName}</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Summary</h2>
        <ul className="list-disc pl-5">
          <li>Links checked: {report.summary.linksChecked}</li>
          <li>Total links to fix: {report.summary.totalLinksToFix}</li>
          <li>Broken links: {report.summary.brokenLinks}</li>
          <li>Hash not found: {report.summary.hashNotFound}</li>
          <li>Network errors: {report.summary.networkErrors}</li>
          <li>Could not check: {report.summary.couldNotCheck}</li>
        </ul>
      </div>

      <table className="bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">Link</th>
            <th className="py-2 px-4 border-b text-left">Page</th>
            <th className="py-2 px-4 border-b text-left">Result</th>
          </tr>
        </thead>
        <tbody>
          {allBrokenLinks.map((link, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="py-2 px-4 border-b">
                <a href={link.href} target="_blank">
                  <LinkRenderer link={link} />
                </a>
              </td>
              <td className="py-2 px-4 border-b">
                {/* https://developer.mozilla.org/en-US/docs/Web/URI/Fragment/Text_fragments */}
                <a href={`${link.page}#:~:text=${encodeURIComponent(link.text)}`} target="_blank">
                  {link.page}
                </a>
              </td>
              <td className="py-2 px-4 border-b">
                {link.result.ok ? (
                  <span className="text-green-600">OK</span>
                ) : (
                  <span className="text-red-600">
                    {link.result.error} {link.result.errorDetail}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function renderReportToHTMLFile(jsonReport: LinkCheckReport, filePath: string) {
  const htmlString = ReactDOMServer.renderToString(<JSONReportRenderer report={jsonReport} />);
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Link Check Report</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root">${htmlString}</div>
      </body>
    </html>
  `;

  writeFileSync(filePath, html);
}

export function saveReport(report: LinkCheckReport) {
  const jsonFilename = `./results/brokenLinks-${report.siteName}.json`;
  const htmlFilename = `./results/brokenLinks-${report.siteName}.html`;

  writeFileSync(jsonFilename, JSON.stringify(report, null, 2));
  console.log(`Saved JSON report to ${jsonFilename}`);

  renderReportToHTMLFile(report, htmlFilename);
  console.log(`Saved HTML report to ${htmlFilename}`);
}
