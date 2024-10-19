import PromisePool from "@supercharge/promise-pool";
import { parseLinksFromPage } from "./page";
import { CONCURRENCY_LIMIT, progressBar } from "./utils";
import { Link } from "./types";
import { checkLinks } from "./link";
import { getReport } from "./report";
import { writeFileSync } from "fs";

require("dotenv").config();

const callReadmeApi = async <T = any>(url: string) => {
  const headers = { authorization: `Basic ${process.env.README_API_KEY}` };
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error for ${url}! status: ${response.status}`);
    }
    return response.json() as T;
  } catch (error) {
    throw new Error(`Parsing error for ${url} : ${error}`);
  }
};

async function fetchCategoriesSlugs() {
  console.log("Fetching categories from Readme...");
  const categories = await callReadmeApi("https://dash.readme.com/api/v1/categories?perPage=100");
  return categories.map((category: any) => category.slug);
}

async function fetchCategoryPages(categorySlug: string): Promise<PageItem[]> {
  return callReadmeApi<PageItem[]>(`https://dash.readme.com/api/v1/categories/${categorySlug}/docs`);
}

async function fetchPage(slug: string) {
  return callReadmeApi<PageData>(`https://dash.readme.com/api/v1/docs/${slug}`);
}

type PageItem = {
  slug: string;
  hidden: boolean;
  children: PageItem[];
};

type PageData = {
  slug: string;
  body_html: string;
};

const flattenNestedPages = (pages: PageItem[]): PageItem[] => {
  return [...pages.map((page) => page), ...pages.flatMap((page) => flattenNestedPages(page.children))];
};

const getPageSlugsFromCategories = async (categorySlugs: string[]) => {
  console.log(`Fetching pages slugs from ${categorySlugs.length} categories...`);
  progressBar.start(categorySlugs.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(CONCURRENCY_LIMIT)
    .for(categorySlugs)
    .process(async (categorySlug) => {
      const categoryPages = await fetchCategoryPages(categorySlug);
      const slugs = flattenNestedPages(categoryPages)
        .filter((page) => !page.hidden)
        .map((page) => page.slug);
      progressBar.increment();
      return slugs;
    });
  progressBar.stop;
  if (errors.length > 0) {
    console.error(`Errors fetching page slugs: ${errors.length}`, errors.toString());
  }
  return results.flat();
};

const extractLinksFromPages = async (pageSlugs: string[]): Promise<Link[]> => {
  console.log(`Extracting links from ${pageSlugs.length} pages...`);
  progressBar.start(pageSlugs.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(CONCURRENCY_LIMIT)
    .for(pageSlugs)
    .process(async (pageSlug) => {
      const page = await fetchPage(pageSlug);
      const links = await parseLinksFromPage("https://dev.fingerprint.com/docs/" + page.slug, page.body_html);
      progressBar.increment();
      return links;
    });
  progressBar.stop;
  if (errors.length > 0) {
    console.error(`Errors fetching pages and extracting links: ${errors.length}`, errors.toString());
  }
  return results.flat();
};

(async () => {
  const startTime = performance.now();

  const categoriesSlugs = await fetchCategoriesSlugs();
  console.log(`Fetched ${categoriesSlugs.length} categories.\n`);

  const pagesSlugs = await getPageSlugsFromCategories(categoriesSlugs);
  console.log(`Fetched ${pagesSlugs.length} pages.\n`);

  const links = await extractLinksFromPages(pagesSlugs);
  console.log(`Extracted ${links.length} links.\n`);

  const { results, errors } = await checkLinks(links);

  const report = getReport(results, errors);
  console.log(report.summary);

  const hostname = "dev.fingerprint.com";
  const filename = `./results/brokenLinks-${hostname}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`Saved report to ${filename}`);
  console.log(`Finished in ${(performance.now() - startTime) / 1000} seconds.`);
})();
