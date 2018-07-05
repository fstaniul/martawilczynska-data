import * as fs from 'fs';
import * as path from 'path';
import { Converter } from 'showdown';
import { promisify } from 'util';
import * as mkdirp from 'mkdirp';

const converter = new Converter();

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(mkdirp);
const exists = promisify(fs.exists);

(async function() {
  const dataFolders = await readdir(path.join(__dirname, 'data'));
  const outputFolderPath = path.join(__dirname, 'output');
  for (const dataFolder of dataFolders) {
    const result: any = {};
    await mkdir(path.join(outputFolderPath, dataFolder));
    const dataFolderPath = path.join(__dirname, 'data', dataFolder);
    const files = (await readdir(dataFolderPath)).filter((fn) => /\.md/.test(fn));
    const metadata = (await exists(path.join(dataFolderPath, '__manifest.json')))
      ? JSON.parse(await readFile(path.join(dataFolderPath, '__manifest.json'), { encoding: 'utf-8' }))
      : {};

    for (const file of files) {
      const name = file.replace(/(.*)\.md/, '$1');
      const data = await readFile(path.join(dataFolderPath, file), { encoding: 'utf-8' });
      result[name] = metadata[name] || {};
      result[name].content = converter.makeHtml(data);
    }

    await writeFile(path.join(outputFolderPath, dataFolder, 'surgical-procedures.json'), JSON.stringify(result), {
      encoding: 'utf-8'
    });
  }
})();
