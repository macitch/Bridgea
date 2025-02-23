import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Define the Metadata type that holds the fetched information.
export type Metadata = {
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
};

/**
 * Attempts to fetch the page using Axios and Cheerio.
 *
 * This function is best for pages where content is static and available in the HTML.
 * It performs the following tasks:
 * 1. Sends an HTTP GET request using Axios.
 * 2. Loads the HTML response into Cheerio for parsing.
 * 3. Extracts metadata such as title, description, and image URL using meta tags.
 * 4. Extracts tags from JSON-LD scripts and meta keywords.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithAxios(url: string): Promise<Metadata> {
  // Fetch the HTML content from the URL.
  const response = await axios.get(url);
  const html = response.data;
  
  // Load the HTML into Cheerio for easy querying.
  const $ = cheerio.load(html);

  // Extract the title using Open Graph meta tag or the <title> element.
  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
  
  // Extract the description from various meta tags.
  const description =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content") ||
    "";
  
  // Extract the image URL from the Open Graph meta tag.
  const imageUrl = $("meta[property='og:image']").attr("content") || "";

  // Initialize empty arrays for tags and categories.
  let tags: string[] = [];
  let categories: string[] = [];

  // Extract tags from JSON-LD scripts if available.
  // JSON-LD can contain structured data including keywords or "about" information.
  $("script[type='application/ld+json']").each((i, script) => {
    try {
      // Parse the JSON-LD content.
      const jsonData = JSON.parse($(script).html() || "{}");
      // Check if keywords are provided.
      if (jsonData.keywords) {
        // Split the keywords string into individual tags and merge them into the tags array.
        tags = [
          ...new Set([
            ...tags,
            ...jsonData.keywords.split(",").map((t: string) => t.trim()),
          ]),
        ];
      } else if (jsonData.about) {
        // If the JSON-LD includes an "about" field, process it accordingly.
        if (typeof jsonData.about === "string") {
          tags.push(jsonData.about);
        } else if (Array.isArray(jsonData.about)) {
          jsonData.about.forEach((item: any) => {
            if (item.name) tags.push(item.name);
          });
        }
      }
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
    }
  });

  // Extract additional tags from the meta keywords tag if available.
  const metaKeywords = $("meta[name='keywords']").attr("content");
  if (metaKeywords) {
    tags = [
      ...new Set([
        ...tags,
        ...metaKeywords.split(",").map((tag) => tag.trim()),
      ]),
    ];
  }

  // Return the fetched metadata, ensuring unique entries with Set.
  return {
    title,
    description,
    imageUrl,
    tags: [...new Set(tags)],
    categories: [...new Set(categories)],
  };
}

/**
 * Uses Puppeteer to fetch metadata from pages that load content dynamically.
 *
 * Puppeteer is used for sites that rely on JavaScript to render content.
 * It does the following:
 * 1. Launches a headless browser.
 * 2. Sets a user agent to mimic a real browser.
 * 3. Navigates to the URL and waits for the network to become idle.
 * 4. Evaluates the page's DOM to extract metadata.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithPuppeteer(url: string): Promise<Metadata> {
  // Launch Puppeteer with arguments to disable sandbox for environments like Heroku.
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set a user agent to mimic a common browser.
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  // Navigate to the target URL and wait until network activity has finished.
  await page.goto(url, { waitUntil: "networkidle2" });
  // Optional: Wait an additional second to ensure dynamic content loads.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Evaluate the page's content in the browser context.
  const metadata: Metadata = await page.evaluate(() => {
    // Helper function to get the content attribute of a meta tag.
    const getMeta = (selector: string): string =>
      document.querySelector(selector)?.getAttribute("content") || "";

    // Extract title from either meta tags or the <title> element.
    const title =
      getMeta("meta[property='og:title']") ||
      document.querySelector("title")?.innerText ||
      "";
    // Extract description from various meta tags.
    const description =
      getMeta("meta[name='description']") ||
      getMeta("meta[property='og:description']") ||
      "";
    // Extract image URL from the Open Graph meta tag.
    const imageUrl = getMeta("meta[property='og:image']") || "";

    let tags: string[] = [];
    // For example, extract tags specific to Behance pages.
    const behanceTags = document.querySelectorAll(".ProjectTags-link");
    if (behanceTags.length > 0) {
      tags = Array.from(behanceTags)
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean);
    }

    // Also, attempt to extract tags from meta keywords.
    const metaKeywords = getMeta("meta[name='keywords']");
    if (metaKeywords) {
      tags = metaKeywords.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    let categories: string[] = [];
    // Extract categories from meta tags (e.g., article section).
    const categoryMeta = getMeta("meta[property='article:section']");
    if (categoryMeta) {
      categories.push(categoryMeta);
    } else {
      // Fallback: try to get categories from a breadcrumbs element.
      const categoryEl = document.querySelector(".Breadcrumbs-listItem span");
      if (categoryEl && categoryEl.textContent) {
        categories.push(categoryEl.textContent.trim());
      }
    }

    // Return the assembled metadata object.
    return { title, description, imageUrl, tags, categories };
  });

  // Close the browser to free up resources.
  await browser.close();
  return metadata;
}

/**
 * Determines which fetching method to use based on the URL's characteristics.
 *
 * This function performs a quick Axios request to examine the page content.
 * If the title is missing or matches patterns of JS-heavy sites (like Behance, Pinterest, etc.),
 * it will return "puppeteer" to indicate that Puppeteer should be used.
 *
 * @param url - The URL of the page.
 * @returns A promise that resolves to either "axios" or "puppeteer".
 */
export async function determineFetchMethod(url: string): Promise<"axios" | "puppeteer"> {
  try {
    // Try fetching the page quickly with Axios.
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract the title to determine if the page is static.
    const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";

    // If no title is found or the title suggests the page is JS-heavy,
    // choose Puppeteer to properly render dynamic content.
    if (!title || /Behance|Pinterest|Instagram|Twitter|Medium/i.test(title)) {
      console.log(`Detected JS-heavy site, using Puppeteer for: ${url}`);
      return "puppeteer";
    }

    // Otherwise, use Axios for faster processing.
    return "axios";
  } catch (error) {
    // If Axios fails (e.g., due to a timeout), fallback to Puppeteer.
    console.error("Axios fetch failed, using Puppeteer:", error);
    return "puppeteer";
  }
}