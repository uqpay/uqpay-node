#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)

function option(name) {
  const index = args.indexOf(name)
  if (index === -1) return null
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath]
  })
}

const manifest = readJson('package.json')
const lockfile = readJson('package-lock.json')
const version = manifest.version
const errors = []

if (lockfile.version !== version) {
  errors.push(`package-lock.json version ${lockfile.version} != package.json ${version}`)
}
if (lockfile.packages?.['']?.version !== version) {
  errors.push(`package-lock root version ${lockfile.packages?.['']?.version} != package.json ${version}`)
}

const httpSource = fs.readFileSync('src/http.ts', 'utf8')
const runtimeMatch = httpSource.match(/export const SDK_VERSION = ['"]([^'"]+)['"]/)
if (!runtimeMatch) {
  errors.push('cannot find SDK_VERSION in src/http.ts')
} else if (runtimeMatch[1] !== version) {
  errors.push(`src/http.ts SDK_VERSION ${runtimeMatch[1]} != package.json ${version}`)
}

const tag = option('--tag')
if (tag !== null) {
  const strictTag = /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/
  if (!strictTag.test(tag)) {
    errors.push(`release tag ${tag} is not strict SemVer`)
  } else if (tag !== `v${version}`) {
    errors.push(`release tag ${tag} != package.json v${version}`)
  }
}

const dist = option('--dist')
if (dist !== null) {
  if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
    errors.push(`build output ${dist} does not exist`)
  } else {
    const builtFiles = filesBelow(dist).filter(file => /\.(?:js|mjs|cjs)$/.test(file))
    const containsVersion = builtFiles.some(file => fs.readFileSync(file, 'utf8').includes(version))
    if (!containsVersion) {
      errors.push(`build output ${dist} does not contain SDK version ${version}`)
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`release version error: ${error}`)
  process.exit(1)
}

console.log(`release version ${version} is consistent`)
