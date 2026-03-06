import { readFileSync, writeFileSync } from 'fs';

const version = process.env.npm_package_version;
if (!version) throw new Error('npm_package_version is not set. Run via: pnpm version <semver>');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = version;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[version] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
