#!/usr/bin/env tsx
/**
 * Fetch OpenAPI spec from beancount service
 *
 * This script fetches the OpenAPI JSON schema from the running beancount service
 * and saves it to beancount-openapi.json for use by orval code generation.
 *
 * Usage:
 *   BEANCOUNT_SERVICE_URL=http://localhost:8000 npm run beancount-client:fetch-spec
 */
import * as fs from 'fs';
import * as path from 'path';

const BEANCOUNT_SERVICE_URL = process.env.BEANCOUNT_SERVICE_URL || 'http://localhost:8000';
const OUTPUT_PATH = path.join(process.cwd(), 'beancount-openapi.json');

async function fetchOpenAPISpec() {
  console.log(`Fetching OpenAPI spec from ${BEANCOUNT_SERVICE_URL}/openapi.json...`);

  try {
    const response = await fetch(`${BEANCOUNT_SERVICE_URL}/openapi.json`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const spec = await response.json() as {
      info?: { title?: string; version?: string };
      paths?: Record<string, unknown>;
    };

    // Write to file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2), 'utf-8');

    console.log(`✓ OpenAPI spec saved to ${OUTPUT_PATH}`);
    console.log(`  Title: ${spec.info?.title}`);
    console.log(`  Version: ${spec.info?.version}`);
    console.log(`  Endpoints: ${Object.keys(spec.paths || {}).length}`);
  } catch (error) {
    console.error('✗ Failed to fetch OpenAPI spec:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${error}`);
    }
    console.error('\nMake sure the beancount service is running at:', BEANCOUNT_SERVICE_URL);
    console.error('You can set a custom URL with: BEANCOUNT_SERVICE_URL=http://... npm run beancount-client:fetch-spec');
    process.exit(1);
  }
}

fetchOpenAPISpec();
