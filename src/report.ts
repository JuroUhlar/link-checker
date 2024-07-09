import { PromisePoolError } from "@supercharge/promise-pool";
import { Link, LinkWithResult } from "./types";

export const getReport = (
  links: LinkWithResult[],
  errors: PromisePoolError<Link>[]
) => {
  const brokenLinks = links.filter(
    (link) => link.result.ok === false && link.result.error === "broken link"
  );
  const hashNotFound = links.filter(
    (link) => link.result.ok === false && link.result.error === "hash not found"
  );
  const networkErrors = [
    ...links.filter(
      (link) =>
        link.result.ok === false && link.result.error === "network error"
    ),
    ...errors.map((error) => ({ ...error.item, result: error.message })),
  ];

  const couldNotCheck = links.filter(
    (link) =>
      link.result.ok === false && link.result.error === "could not check"
  );

  return {
    summary: {
      totalLinksToFix:
        brokenLinks.length + hashNotFound.length + networkErrors.length,
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
