import { getTestBed } from '@angular/core/testing';
import { platformBrowserTesting, BrowserTestingModule } from '@angular/platform-browser/testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize the Angular testing environment once for all tests
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

// Configure resource loader for Angular components to work with vitest
const originalFetch = globalThis.fetch as any;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  // Handle component template and style loading
  if (typeof url === 'string') {
    const urlString = url.toString();

    // For relative URLs like ./landing.html
    if (urlString.startsWith('./') && (urlString.endsWith('.html') || urlString.endsWith('.scss'))) {
      // Don't try to load - let Angular's compiler handle it
      return new Response('', { status: 404 });
    }

    // For absolute paths
    if ((urlString.endsWith('.html') || urlString.endsWith('.scss')) && urlString.includes('src/app')) {
      try {
        // Try to read the file directly if it's a local file path
        const filePath = resolve(process.cwd(), urlString.replace(/^\//, ''));
        const content = readFileSync(filePath, 'utf-8');
        return new Response(content, {
          status: 200,
          headers: { 'content-type': urlString.endsWith('.html') ? 'text/html' : 'text/css' },
        });
      } catch {
        return new Response('', { status: 404 });
      }
    }
  }

  return originalFetch(input, init);
};
