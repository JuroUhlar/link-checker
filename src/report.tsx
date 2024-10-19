import { PromisePoolError } from "@supercharge/promise-pool";
import { Link, LinkWithResult } from "./types";
import ReactDOMServer from "react-dom/server";
import React from "react";
import { writeFileSync } from "fs";

const LinkList = ({ links }: { links: LinkWithResult[] }) => (
  <ul className="list-disc pl-5">
    {links.map((link, index) => (
      <li key={index} className="mb-2">
        <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {link.text}
        </a>
        {link.result && !link.result.ok && <span className="ml-2 text-red-600">({link.result.error})</span>}
      </li>
    ))}
  </ul>
);

const JSONReportRenderer = ({ report }: { report: LinkCheckReport }) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Link Check Report</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Summary</h2>
        <ul className="list-disc pl-5">
          <li>Total links to fix: {report.summary.totalLinksToFix}</li>
          <li>Broken links: {report.summary.brokenLinks}</li>
          <li>Hash not found: {report.summary.hashNotFound}</li>
          <li>Network errors: {report.summary.networkErrors}</li>
          <li>Could not check: {report.summary.couldNotCheck}</li>
        </ul>
      </div>

      {report.brokenLinks.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Broken Links</h2>
          <LinkList links={report.brokenLinks} />
        </section>
      )}

      {report.hashNotFound.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Hash Not Found</h2>
          <LinkList links={report.hashNotFound} />
        </section>
      )}

      {report.networkErrors.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Network Errors</h2>
          <LinkList links={report.networkErrors} />
        </section>
      )}

      {report.couldNotCheck.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Could Not Check</h2>
          <LinkList links={report.couldNotCheck} />
        </section>
      )}
    </div>
  );
};

type LinkCheckReport = ReturnType<typeof getJSONReport>;

export const getJSONReport = (links: LinkWithResult[], errors: PromisePoolError<Link>[]) => {
  const brokenLinks = links.filter((link) => link.result.ok === false && link.result.error === "broken link");
  const hashNotFound = links.filter((link) => link.result.ok === false && link.result.error === "hash not found");
  const networkErrors = [...links.filter((link) => link.result.ok === false && link.result.error === "network error")];
  const couldNotCheck = links.filter((link) => link.result.ok === false && link.result.error === "could not check");

  return {
    summary: {
      totalLinksToFix: brokenLinks.length + hashNotFound.length + networkErrors.length,
      brokenLinks: brokenLinks.length,
      hashNotFound: hashNotFound.length,
      networkErrors: networkErrors.length,
      couldNotCheck: couldNotCheck.length,
    },
    brokenLinks,
    hashNotFound,
    networkErrors,
    couldNotCheck,
  };
};

export function renderReportToHTML(jsonReport: LinkCheckReport, filePath: string) {
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
