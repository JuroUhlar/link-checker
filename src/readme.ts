import PromisePool from "@supercharge/promise-pool";
import { parseLinksFromPage } from "./page";
import { CONCURRENCY_LIMIT, progressBar } from "./utils";
import { url } from "inspector";

require("dotenv").config();

const callReadmeApi = async <T = any>(url: string) => {
  const headers = {
    authorization: `Basic ${process.env.README_API_KEY}`,
  };
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
  const categories = await callReadmeApi(
    "https://dash.readme.com/api/v1/categories?perPage=100"
  );
  return categories.map((category: any) => category.slug);
}

async function fetchCategoryPages(categorySlug: string): Promise<Page[]> {
  return callReadmeApi<Page[]>(
    `https://dash.readme.com/api/v1/categories/${categorySlug}/docs`
  );
}

async function fetchPage(slug: string) {
  return callReadmeApi<Page>(`https://dash.readme.com/api/v1/docs/${slug}`);
}

type Page = {
  slug: string;
  hidden: boolean;
  children: Page[];
};

const extractSlugsFromNestedPages = (pages: Page[]): string[] => {
  return [
    ...pages.map((page) => page.slug),
    ...pages.flatMap((page) => extractSlugsFromNestedPages(page.children)),
  ];
};

(async () => {
  const allPageSlugs: string[] = [];
  const categoriesSlugs = await fetchCategoriesSlugs();
  console.log(categoriesSlugs);
  for (const category of categoriesSlugs) {
    console.log(category);
    const categoryPages = await fetchCategoryPages(category);
    const publicCategoryPages = categoryPages?.filter((page) => !page.hidden);
    console.log(publicCategoryPages.length);
    const slugs = extractSlugsFromNestedPages(publicCategoryPages);
    console.log(slugs);
    allPageSlugs.push(...slugs);
  }
  console.log(allPageSlugs.length);

  progressBar.start(allPageSlugs.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(
    CONCURRENCY_LIMIT
  )
    .for(allPageSlugs)
    .process(async (pageSlug) => {
      const page = await fetchPage(pageSlug);
      const links = await parseLinksFromPage(
        "https://dev.fingerprint.com/docs/" + page.slug,
        page.body_html
      );
      progressBar.increment();
      return links;
    });
  progressBar.stop;

  console.log(results, errors);
})();
