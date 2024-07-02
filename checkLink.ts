import * as cheerio from "cheerio";

export type LinkCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "hash not found" | "broken link" | "network error";
      errorDetail?: string;
    };

/**
 *
 * @param url link URL
 * @returns LinkCheckResult
 * @throws {Error} - network can fail or something
 */
export const checkLink = async (url: string): Promise<LinkCheckResult> => {
  const hash = new URL(url).hash;
  const response = await fetch(url, {
    method: hash ? "GET" : "HEAD",
    redirect: "follow",
  });
  if (response.status !== 200) {
    return { ok: false, error: "broken link" };
  }
  if (hash) {
    var $ = cheerio.load(await response.text());
    var element = $(hash);
    if (element.length === 0) {
      return { ok: false, error: "hash not found" };
    }
  }
  return { ok: true };
};
