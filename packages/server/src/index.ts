import { extname, join, resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { cwd } from 'node:process';
import { readFile, readdir, writeFile } from 'fs/promises';

const port = process.env.PORT || 8080;

async function convertToJsonArrayAndWriteIndexJson(folderPath: string): Promise<void> {
  // Read the list of files in the specified folder.
  const files = await readdir(folderPath);

  // Filter for JSON files (files with a .json extension).
  const jsonFiles = files.filter((file) => extname(file) === '.json');

  // Read and parse each JSON file into an array.
  const jsonArray: any[] = [];
  for (const jsonFile of jsonFiles.filter((f) => f !== 'index.json' && f !== 'style.json')) {
    const jsonFilePath = join(folderPath, jsonFile);
    const jsonData = await readFile(jsonFilePath, 'utf-8');
    const parsedData = JSON.parse(jsonData);
    jsonArray.push(parsedData);
  }

  // Write the array to index.json in the same folder.
  const indexJsonPath = join(folderPath, 'index.json');
  await writeFile(indexJsonPath, JSON.stringify(jsonArray, null, 2));
  console.log('Successfully created index.json');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });

  const layerStylesPath = resolve(cwd(), 'layer_styles');
  await convertToJsonArrayAndWriteIndexJson(layerStylesPath);

  await app.listen(port, () => console.log(`Listening on port ${port}.`));
}
bootstrap();
