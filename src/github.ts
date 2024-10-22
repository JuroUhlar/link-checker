import { Octokit } from "@octokit/rest";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const OUTPUT_DIR = "./downloaded_md_files";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set");
}

// Initialize without token for public repos, but you can add a token for higher rate limits
const octokit = new Octokit({ auth: GITHUB_TOKEN });

interface MdFile {
  path: string;
  url: string;
}

async function downloadMdFilesFromOrg(orgName: string): Promise<void> {
  try {
    const repos = await getAllOrgRepositories(orgName);
    console.log(`Found ${repos.length} public repositories in ${orgName} organization.`);

    for (const repo of repos) {
      console.log(`\nProcessing repository: ${repo.full_name}`);
      try {
        const mdFiles = await findReadmeFilesInRepo(repo.owner.login, repo.name);
        console.log(`Found ${mdFiles.length} markdown files in ${repo.full_name}`);
        await downloadFiles(mdFiles, repo.owner.login, repo.name);
      } catch (error) {
        console.error(`Error processing repository ${repo.full_name}: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    console.error(`Error processing organization ${orgName}: ${(error as Error).message}`);
  }
}

async function getAllOrgRepositories(orgName: string) {
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: orgName,
    type: "public",
    per_page: 100,
  });

  return repos.map((repo) => ({
    full_name: repo.full_name,
    owner: { login: repo.owner!.login },
    name: repo.name,
  }));
}

async function findReadmeFilesInRepo(owner: string, repo: string): Promise<MdFile[]> {
  // Get the default branch
  const { data: repoData } = await octokit.repos.get({
    owner,
    repo,
  });
  const defaultBranch = repoData.default_branch;

  // Get the complete tree with all files
  const { data: treeData } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: defaultBranch,
    recursive: "1",
  });

  // Filter only markdown files
  const mdFiles = treeData.tree
    .filter((item) => item.type === "blob" && item.path?.toLowerCase().endsWith("readme.md"))
    .map((item) => ({
      path: item.path!,
      url: `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`,
    }));

  return mdFiles;
}

async function downloadFiles(files: MdFile[], owner: string, repo: string): Promise<void> {
  const downloadPromises = files.map(async (file) => {
    const filePath = `${OUTPUT_DIR}/${repo}_${file.path.replace(/\//g, "_")}`;

    try {
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
      console.log(`✓ Downloaded: ${file.path}`);
    } catch (error) {
      console.error(`✗ Error downloading ${file.path}: ${(error as Error).message}`);
    }
  });

  // Download files in parallel with a concurrency limit
  const BATCH_SIZE = 5;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((file) => downloadPromises[i]));
  }
}

async function main() {
  const organizationName = process.argv[2] || "fingerprintjs";

  console.log(`Starting download of Readme.md files from ${organizationName} organization...`);
  console.log("Files will be saved to:", path.resolve(OUTPUT_DIR));

  const startTime = Date.now();

  try {
    await downloadMdFilesFromOrg(organizationName);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nAll downloads completed in ${duration} seconds`);
  } catch (error) {
    console.error("Error:", (error as Error).message);
  }
}

// Allow organization name to be passed as command line argument
main();
