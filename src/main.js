import "src/app.css"

import {identity} from "ramda"
import {Fetch, Storage, createMap} from "hurdak"

if (Storage.hasItem("Keys.pubkey")) {
  const pubkey = Storage.getJson("Keys.pubkey")
  const sessions = Storage.getJson("Keys.keyState")

  Storage.clear()

  if (pubkey) {
    Storage.setJson("pubkey", pubkey)
    Storage.setJson("sessions", createMap("pubkey", sessions))
  }
}

import Bugsnag from "@bugsnag/js"
import {tryFetch} from "src/util/misc"
import {env, saveRelay} from "src/engine"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

if (import.meta.env.VITE_BUGSNAG_API_KEY) {
  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    collectUserIp: false,
  })
}

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

const fromCsv = s => (s || "").split(",").filter(identity)

const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL

const DUFFLEPUD_URL = import.meta.env.VITE_DUFFLEPUD_URL

const MULTIPLEXTR_URL = import.meta.env.VITE_MULTIPLEXTR_URL

const NIP96_URLS = fromCsv(import.meta.env.VITE_NIP96_URLS)

const FORCE_RELAYS = fromCsv(import.meta.env.VITE_FORCE_RELAYS)

const DVM_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : fromCsv(import.meta.env.VITE_DVM_RELAYS)

const SEARCH_RELAYS =
  FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://relay.nostr.band", "wss://nostr.wine"]

const DEFAULT_RELAYS =
  FORCE_RELAYS.length > 0 ? FORCE_RELAYS : fromCsv(import.meta.env.VITE_DEFAULT_RELAYS)

const DEFAULT_FOLLOWS = fromCsv(import.meta.env.VITE_DEFAULT_FOLLOWS)

const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)

const ENABLE_GROUPS = JSON.parse(import.meta.env.VITE_ENABLE_GROUPS)

const ENABLE_JUKEBOX = JSON.parse(import.meta.env.VITE_ENABLE_JUKEBOX)

// Prep our env
env.set({
  DEFAULT_FOLLOWS,
  NIP96_URLS,
  IMGPROXY_URL,
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  DVM_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
  ENABLE_ZAPS,
  ENABLE_GROUPS,
  ENABLE_JUKEBOX,
})

// Throw some hardcoded defaults in there
DEFAULT_RELAYS.forEach(saveRelay)

// Load relays from nostr.watch via dufflepud
if (FORCE_RELAYS.length === 0 && DUFFLEPUD_URL) {
  tryFetch(async () => {
    const json = await Fetch.fetchJson(DUFFLEPUD_URL + "/relay")

    json.relays.forEach(saveRelay)
  })
}

export default new App({
  target: document.getElementById("app"),
})
