import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

type Metadata = {
  title: string;
  description: string;
  imageUrl: string;
};

// Use Axios and Cheerio for sites that render metadata in the initial HTML
async function fetchMetadataWithAxios(url: string): Promise<Metadata> {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // Try to get metadata from Open Graph tags first, then fall back to the <title> tag.
  const title =
    $("meta[property='og:title']").attr('content') ||
    $('title').text() ||
    '';
  const description =
    $("meta[property='og:description']").attr('content') ||
    $("meta[name='description']").attr('content') ||
    '';
  const imageUrl = $("meta[property='og:image']").attr('content') || '';

  return { title, description, imageUrl };
}

// Use Puppeteer for pages that load metadata dynamically (e.g., Behance)
async function fetchMetadataWithPuppeteer(url: string): Promise<Metadata> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Set a realistic user agent to avoid blocking
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  // Navigate to the URL and wait until the network is idle
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Wait a bit to allow dynamic content to settle (using custom delay)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Evaluate the page to extract metadata
  const metadata: Metadata = await page.evaluate(() => {
    const getMeta = (selector: string): string => {
      const element = document.querySelector(selector);
      return element ? element.getAttribute('content') || '' : '';
    };

    const title =
      document.querySelector('title')?.innerText ||
      getMeta("meta[property='og:title']") ||
      '';
    const description =
      getMeta("meta[property='og:description']") ||
      getMeta("meta[name='description']") ||
      '';
    const imageUrl = getMeta("meta[property='og:image']") || '';

    return { title, description, imageUrl };
  });

  await browser.close();
  return metadata;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    let metadata: Metadata;

    // If the URL contains "behance.net", use Puppeteer; otherwise, use Axios/Cheerio.
    if (url.includes('behance.net')) {
      metadata = await fetchMetadataWithPuppeteer(url);
    } else {
      metadata = await fetchMetadataWithAxios(url);
    }

    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}