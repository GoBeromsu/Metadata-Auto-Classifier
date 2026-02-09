#!/usr/bin/env node
// @ts-check
/**
 * Unified dev orchestrator for Obsidian plugins.
 * Discovers vaults, mounts plugin, starts watch build, syncs output.
 *
 * Usage:
 *   pnpm dev                        # Interactive vault selection
 *   pnpm dev --vault Ataraxia       # By name or path
 *   pnpm dev --non-interactive      # Error if vault can't be resolved
 *   pnpm dev --print-vaults         # List discovered vaults and exit
 *
 * Environment:
 *   VAULT_PATH  — Single vault absolute/relative path
 *   VAULT_NAME  — Match by vault name from Obsidian registry
 *   VAULT_PATHS — Multiple vault paths (comma-separated)
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { URL } from 'node:url'

// ---------------------------------------------------------------------------
// 1. Load repo-specific config
// ---------------------------------------------------------------------------
const configPath = new URL('./dev.config.mjs', import.meta.url)
const config = (await import(configPath.href)).default

// ---------------------------------------------------------------------------
// 2. Parse .env (simple key=value, no external deps)
// ---------------------------------------------------------------------------
function loadDotenv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 0) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadDotenv()

// ---------------------------------------------------------------------------
// 3. CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
function getArg(name) {
  const idx = args.indexOf(name)
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1]
  return undefined
}
const cliVault = getArg('--vault')
const cliVaults = getArg('--vaults')
const nonInteractive = args.includes('--non-interactive')
const printVaults = args.includes('--print-vaults')

// ---------------------------------------------------------------------------
// 4. Obsidian vault discovery
// ---------------------------------------------------------------------------
function getObsidianConfigPath() {
  const home = os.homedir()
  const platform = os.platform()

  /** @type {string[]} */
  const candidates = []

  if (platform === 'darwin') {
    // macOS default install uses "Obsidian" (capital O). Keep lowercase fallback for safety.
    candidates.push(
      path.join(home, 'Library', 'Application Support', 'Obsidian', 'obsidian.json'),
      path.join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json'),
    )
  } else if (platform === 'linux') {
    const xdg = process.env.XDG_CONFIG_HOME
    const configBases = [xdg, path.join(home, '.config')].filter(Boolean)
    for (const base of configBases) {
      candidates.push(
        path.join(base, 'Obsidian', 'obsidian.json'),
        path.join(base, 'obsidian', 'obsidian.json'),
      )
    }
    // Legacy fallback
    candidates.push(path.join(home, '.obsidian', 'obsidian.json'))
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA
    if (appData) {
      candidates.push(
        path.join(appData, 'Obsidian', 'obsidian.json'),
        path.join(appData, 'obsidian', 'obsidian.json'),
      )
    }
  }

  for (const file of candidates) {
    if (file && fs.existsSync(file)) return file
  }
  return ''
}

function discoverVaults() {
  const configFile = getObsidianConfigPath()
  if (!configFile || !fs.existsSync(configFile)) return []
  try {
    const data = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
    const vaults = data.vaults || {}
    return Object.values(vaults)
      .filter((v) => v.path && fs.existsSync(v.path))
      .map((v) => ({ name: path.basename(v.path), path: v.path }))
  } catch {
    return []
  }
}

const vaults = discoverVaults()

if (printVaults) {
  console.log('Discovered Obsidian vaults:')
  for (const v of vaults) console.log(`  ${v.name}  →  ${v.path}`)
  if (!vaults.length) console.log('  (none found)')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 5. Vault resolution: CLI > env > .env > obsidian.json > interactive
// ---------------------------------------------------------------------------
function resolveVaultByNameOrPath(input) {
  // Try name match first
  const byName = vaults.find((v) => v.name === input)
  if (byName) return [byName.path]
  // Try as path
  if (fs.existsSync(input)) return [path.resolve(input)]
  return []
}

async function resolveVaults() {
  // CLI --vaults
  if (cliVaults) return cliVaults.split(',').map((p) => path.resolve(p.trim()))

  // CLI --vault
  if (cliVault) {
    const resolved = resolveVaultByNameOrPath(cliVault)
    if (resolved.length) return resolved
    console.error(`Vault not found: ${cliVault}`)
    console.error('Available:', vaults.map((v) => v.name).join(', ') || '(none)')
    process.exit(1)
  }

  // VAULT_PATHS env
  if (process.env.VAULT_PATHS) {
    return process.env.VAULT_PATHS.split(',').map((p) => path.resolve(p.trim()))
  }

  // VAULT_PATH env
  if (process.env.VAULT_PATH) return [path.resolve(process.env.VAULT_PATH)]

  // VAULT_NAME env
  if (process.env.VAULT_NAME) {
    const resolved = resolveVaultByNameOrPath(process.env.VAULT_NAME)
    if (resolved.length) return resolved
    console.error(`Vault name not found: ${process.env.VAULT_NAME}`)
    process.exit(1)
  }

  // Single vault → auto-select
  if (vaults.length === 1) {
    console.log(`Auto-selecting vault: ${vaults[0].name}`)
    return [vaults[0].path]
  }

  if (nonInteractive) {
    console.error('Cannot determine vault in non-interactive mode.')
    console.error('Set VAULT_PATH, VAULT_NAME, or use --vault <name>')
    process.exit(1)
  }

  // Interactive selection
  if (!vaults.length) {
    console.error('No Obsidian vaults found. Set VAULT_PATH env variable.')
    process.exit(1)
  }

  console.log('\nSelect Obsidian Vault for development:')
  for (let i = 0; i < vaults.length; i++) {
    console.log(`  ${i + 1}) ${vaults[i].name}  (${vaults[i].path})`)
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((resolve) => {
    rl.question('\nEnter number: ', (ans) => {
      rl.close()
      resolve(ans.trim())
    })
  })

  const idx = parseInt(answer, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= vaults.length) {
    console.error('Invalid selection.')
    process.exit(1)
  }
  return [vaults[idx].path]
}

const selectedVaults = await resolveVaults()
console.log(`\nTarget vault(s): ${selectedVaults.join(', ')}`)

// ---------------------------------------------------------------------------
// 6. Read manifest.json for plugin ID
// ---------------------------------------------------------------------------
const manifestPath = path.resolve(process.cwd(), 'manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
const pluginId = manifest.id
console.log(`Plugin: ${pluginId}`)

// ---------------------------------------------------------------------------
// 7. Mount: create plugin dirs + copy static files + .hotreload
// ---------------------------------------------------------------------------
for (const vaultPath of selectedVaults) {
  const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', pluginId)
  fs.mkdirSync(pluginDir, { recursive: true })

  // Copy static files
  if (config.deploy.staticFiles) {
    for (const sf of config.deploy.staticFiles) {
      const src = path.resolve(process.cwd(), sf.from)
      const dest = path.join(pluginDir, sf.to)
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest)
        console.log(`  Copied ${sf.from} → ${pluginDir}`)
      }
    }
  }

  // Check hot-reload plugin
  const hotReloadDir = path.join(vaultPath, '.obsidian', 'plugins', 'hot-reload')
  if (!fs.existsSync(hotReloadDir)) {
    console.warn(`\n⚠ hot-reload plugin not found in vault "${path.basename(vaultPath)}"`)
    console.warn('  Install from: https://github.com/pjeby/hot-reload')
    console.warn('  Continuing without hot-reload...\n')
  }

  // Create .hotreload marker
  fs.writeFileSync(path.join(pluginDir, '.hotreload'), '')
}

// ---------------------------------------------------------------------------
// 8. Start build + deploy
// ---------------------------------------------------------------------------
const { deploy } = config

if (deploy.mode === 'delegate') {
  // Delegate mode: inject vault paths as env var and run build script
  const vaultEnvValue = selectedVaults.join(',')
  const env = { ...process.env, [deploy.envVar]: vaultEnvValue }

  console.log(`\nStarting build (delegate mode, ${deploy.envVar}=${vaultEnvValue})...\n`)
  const child = spawn(config.buildCommand[0], config.buildCommand.slice(1), {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  })

  const cleanup = () => {
    child.kill()
    process.exit(0)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  child.on('exit', (code) => process.exit(code ?? 0))
} else {
  // Copy mode: run dev:build, watch output files, copy to vault
  console.log('\nStarting build (copy mode)...\n')
  const child = spawn(config.buildCommand[0], config.buildCommand.slice(1), {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  const cleanup = () => {
    child.kill()
    process.exit(0)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  child.on('exit', (code) => {
    if (code !== null && code !== 0) process.exit(code)
  })

  const startWatch = (srcFile, destName) => {
    let debounce = null
    fs.watch(srcFile, () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => {
        for (const vaultPath of selectedVaults) {
          const pluginDir = path.join(vaultPath, '.obsidian', 'plugins', pluginId)
          const destFile = path.join(pluginDir, destName)
          try {
            fs.copyFileSync(srcFile, destFile)
            // Update .hotreload timestamp
            fs.writeFileSync(path.join(pluginDir, '.hotreload'), String(Date.now()))
          } catch (err) {
            console.error(`Failed to copy ${srcFile} → ${destFile}:`, err.message)
          }
        }
        console.log(`[${new Date().toLocaleTimeString()}] Synced ${destName} → vault(s)`)
      }, 100)
    })
  }

  // Watch output files and copy to vault(s)
  if (deploy.watchFiles) {
    for (const wf of deploy.watchFiles) {
      const srcFile = path.resolve(process.cwd(), wf.from)

      // Wait for file to exist before watching
      const waitForFile = () => {
        if (fs.existsSync(srcFile)) {
          startWatch(srcFile, wf.to)
        } else {
          setTimeout(waitForFile, 500)
        }
      }
      waitForFile()
    }
  }
}
