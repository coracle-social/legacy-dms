import {now, Tags} from "paravel"
import {seconds, batch} from "hurdak"
import {pluck, identity, max, without, sortBy} from "ramda"
import {noteKinds, reactionKinds, getParentId} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {env, sessions} from "src/engine/session/state"
import {_events} from "src/engine/events/state"
import {events, isEventMuted} from "src/engine/events/derived"
import {mergeHints, getPubkeyHints, getParentHints} from "src/engine/relays/utils"
import {
  loadPubkeys,
  load,
  subscribe,
  subscribePersistent,
  getIdFilters,
} from "src/engine/network/utils"

const onNotificationEvent = batch(300, (chunk: Event[]) => {
  const kinds = getNotificationKinds()
  const $isEventMuted = isEventMuted.get()
  const events = chunk.filter(e => kinds.includes(e.kind) && !$isEventMuted(e))
  const eventsWithParent = chunk.filter(getParentId)

  loadPubkeys(pluck("pubkey", events))

  load({
    relays: mergeHints(eventsWithParent.map(getParentHints)),
    filters: getIdFilters(eventsWithParent.flatMap(e => Tags.from(e).replies().values().all())),
    onEvent: e => _events.update($events => $events.concat(e)),
  })

  _events.mapStore.update($m => {
    for (const e of events) {
      $m.set(e.id, e)
    }

    return $m
  })
})

export const getNotificationKinds = () =>
  without(env.get().ENABLE_ZAPS ? [] : [EventKind.Zap], [...noteKinds, ...reactionKinds, 1059])

export const loadNotifications = () => {
  const kinds = getNotificationKinds()
  const pubkeys = Object.keys(sessions.get())
  const cutoff = now() - seconds(30, "day")
  const $sessions = Object.values(sessions.get())
  const lastChecked = pluck("notifications_last_synced", $sessions).filter(identity).reduce(max, 0)
  const since = Math.max(cutoff, lastChecked - seconds(1, "day"))

  const eventIds = pluck(
    "id",
    sortBy(
      e => -e.created_at,
      events
        .get()
        .filter(
          e =>
            !reactionKinds.includes(e.kind) && e.created_at > cutoff && pubkeys.includes(e.pubkey),
        ),
    ).slice(0, 256),
  )

  const filters = [
    {kinds, "#p": pubkeys, since},
    {kinds, "#e": eventIds, since},
    {kinds, authors: pubkeys, since},
  ]

  return subscribe({
    filters,
    timeout: 15000,
    skipCache: true,
    relays: mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read"))),
    onEvent: onNotificationEvent,
  })
}

export const listenForNotifications = async () => {
  const pubkeys = Object.keys(sessions.get())

  // Only grab one event from each category/relay so we have enough to show
  // the notification badges, but load the details lazily
  subscribePersistent({
    skipCache: true,
    relays: mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read"))),
    filters: [{kinds: [4], "#p": pubkeys, limit: 1}],
    onEvent: onNotificationEvent,
  })
}
