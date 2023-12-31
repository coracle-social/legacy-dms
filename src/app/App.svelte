<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {nip19, getPublicKey, generatePrivateKey} from "nostr-tools"
  import {pluck} from "ramda"
  import {seconds, Fetch} from "hurdak"
  import {now} from "paravel"
  import {tryFetch, hexToBech32, bech32ToHex} from "src/util/misc"
  import {storage, session, stateKey, relays, getSetting, dufflepud} from "src/engine"
  import * as engine from "src/engine"
  import {loadAppData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import SideNav from "src/app/SideNav.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import TopNav from "src/app/TopNav.svelte"
  import {isNil} from "ramda"
  import {onMount} from "svelte"
  import {memoize} from "src/util/misc"
  import About from "src/app/views/About.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import EventDetail from "src/app/views/EventDetail.svelte"
  import Help from "src/app/views/Help.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import LabelDetail from "src/app/views/LabelDetail.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginAdvanced from "src/app/views/LoginAdvanced.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import Logout from "src/app/views/Logout.svelte"
  import MessagesDetail from "src/app/views/MessagesDetail.svelte"
  import MessagesList from "src/app/views/MessagesList.svelte"
  import ModalMessage from "src/app/views/ModalMessage.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import PersonFollows from "src/app/shared/PersonFollows.svelte"
  import PersonFollowers from "src/app/shared/PersonFollowers.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonZap from "src/app/views/PersonZap.svelte"
  import PublishInfo from "src/app/views/PublishInfo.svelte"
  import QRCode from "src/app/views/QRCode.svelte"
  import MediaDetail from "src/app/views/MediaDetail.svelte"
  import RelayBrowse from "src/app/views/RelayBrowse.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayList from "src/app/views/RelayList.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"
  // import ReportCreate from "src/app/views/ReportCreate.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import UserKeys from "src/app/views/UserKeys.svelte"
  import UserProfile from "src/app/views/UserProfile.svelte"
  import UserSettings from "src/app/views/UserSettings.svelte"
  import {logUsage} from "src/app/state"
  import {
    router,
    asPerson,
    asNaddr,
    asCsv,
    asString,
    asUrlComponent,
    asFilter,
    asNote,
    asRelay,
    asEntity,
  } from "src/app/router"

  // Routes

  router.register("/about", About)
  router.register("/login", Login)
  router.register("/bech32", Bech32Entity)

  router.register("/", MessagesList, {
    requireUser: true,
  })
  router.register("/conversations", MessagesList, {
    requireUser: true,
  })
  router.register("/conversations/requests", MessagesList, {
    requireUser: true,
  })
  router.register("/conversations/:entity", MessagesDetail, {
    requireUser: true,
    serializers: {
      entity: asPerson,
    },
  })

  router.register("/events/:address", EventDetail, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/help/:topic", Help)

  router.register("/labels/:label", LabelDetail, {
    serializers: {
      label: asUrlComponent("label"),
      relays: asCsv("relays"),
    },
  })

  router.register("/lists", ListList)
  router.register("/lists/create", ListEdit)
  router.register("/lists/select", ListSelect, {
    serializers: {
      type: asString("type"),
      value: asString("value"),
    },
  })
  router.register("/lists/:naddr", ListEdit)

  router.register("/login/advanced", LoginAdvanced)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/connect", LoginConnect)
  router.register("/login/intro", Login)
  router.register("/login/privkey", LoginPrivKey)
  router.register("/login/pubkey", LoginPubKey)
  router.register("/logout", Logout)

  router.register("/media/:url", MediaDetail, {
    serializers: {
      url: asUrlComponent("url"),
    },
  })

  router.register("/message", ModalMessage)

  router.register("/notes/:entity", NoteDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/label", LabelCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/status", PublishInfo, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/thread", ThreadDetail, {
    serializers: {
      entity: asNote,
    },
  })

  router.register("/onboarding", Onboarding)

  router.register("/people/list", PersonList, {
    serializers: {
      pubkeys: asCsv("pubkeys"),
    },
  })
  router.register("/people/:entity", PersonDetail, {
    serializers: {
      entity: asPerson,
      filter: asFilter,
    },
  })
  router.register("/people/:entity/followers", PersonFollowers, {
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/follows", PersonFollows, {
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/info", PersonInfo, {
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/zap", PersonZap, {
    serializers: {
      eid: asNote,
      entity: asPerson,
      lnurl: asString("lnurl"),
    },
  })

  router.register("/qrcode/:code", QRCode)

  router.register("/relays/browse", RelayBrowse)
  router.register("/relays/:entity", RelayDetail, {
    serializers: {
      entity: asRelay,
      filter: asFilter,
    },
  })
  router.register("/relays/:entity/review", RelayReview, {
    serializers: {
      entity: asRelay,
    },
  })

  router.register("/settings", UserSettings, {
    requireUser: true,
  })
  router.register("/settings/keys", UserKeys, {
    requireUser: true,
  })
  router.register("/settings/profile", UserProfile, {
    requireUser: true,
  })
  router.register("/settings/relays", RelayList, {
    requireUser: true,
  })

  router.register("/topics/:topic", TopicFeed)

  router.register("/:entity", Bech32Entity, {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })
  router.register("/:entity/*", Bech32Entity, {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })

  router.init()

  // Globals
  ;(window as any).g = {
    ...engine,
    nip19,
    bech32ToHex,
    hexToBech32,
    router,
    getPublicKey,
    generatePrivateKey,
  }

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--gray-8); }`

  // Scroll position

  let scrollY

  router.history.subscribe($history => {
    if ($history[0].config.modal) {
      // This is not idempotent, so don't duplicate it
      if (document.body.style.position !== "fixed") {
        scrollY = window.scrollY

        document.body.style.top = `-${scrollY}px`
        document.body.style.position = `fixed`
      }
    } else if (!isNil(scrollY)) {
      const offset = scrollY

      // I don't know why this timeout is necessary
      setTimeout(() => {
        document.body.setAttribute("style", "")
        window.scrollTo(0, offset)
      }, 100)

      scrollY = null
    }
  })

  // Usage logging, router listener

  onMount(() => {
    const unsubPage = router.page.subscribe(
      memoize($page => {
        if ($page) {
          logUsage(btoa($page.path))
        }

        window.scrollTo(0, 0)
      }),
    )

    const unsubModal = router.modal.subscribe($modal => {
      if ($modal) {
        logUsage(btoa($modal.path))
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
    }
  })

  // Protocol handler

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string,
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  // App data boostrap and relay meta fetching

  storage.ready.then(() => {
    if ($session) {
      loadAppData()
    }

    const interval = setInterval(async () => {
      if (!getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not asking for too much data at once
      const staleRelays = relays
        .get()
        .filter(r => (r.info?.last_checked || 0) < now() - seconds(7, "day"))
        .slice(0, 20)

      tryFetch(async () => {
        const result = await Fetch.fetchJson(dufflepud("relay/info"), {
          method: "POST",
          body: JSON.stringify({urls: pluck("url", staleRelays)}),
          headers: {
            "Content-Type": "application/json",
          },
        })

        for (const {url, info} of result.data) {
          relays.key(url).merge({...info, url, last_checked: now()})
        }
      })
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

{#await storage.ready}
  <!-- pass -->
{:then}
  <div>
    <Routes />
    {#key $stateKey}
      <SideNav />
      <TopNav />
      <Toast />
    {/key}
  </div>
{/await}
