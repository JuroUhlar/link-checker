export type Link = {
  page: string;
  href: string;
  text: string;
  result?: LinkCheckResult;
};

export type LinkWithResult = Link & { result: LinkCheckResult };

export type LinkCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "hash not found" | "broken link" | "network error";
      errorDetail?: string;
    };
