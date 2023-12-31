<script context="module" lang="ts">
  export type Values = {
    name: string
    image: string
    description: string
    isPublic: boolean
    relays: string[]
    members?: Person[]
  }
</script>

<script lang="ts">
  import {pluck} from "ramda"
  import {ucFirst} from "hurdak"
  import {fly} from "src/util/transition"
  import {toast} from "src/partials/state"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import ImageInput from "src/partials/ImageInput.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import type {Person} from "src/engine"
  import {searchRelays, normalizeRelayUrl} from "src/engine"

  export let onSubmit
  export let values: Values
  export let mode = "create"
  export let showMembers = false

  const isAlreadyPublic = values.isPublic
  const searchRelayUrls = q => pluck("url", $searchRelays(q))

  const submit = async () => {
    if (values.relays.length < 1) {
      toast.show("error", "At least one relay is required.")

      return
    }

    await onSubmit(values)

    toast.show("info", "Your group has been saved!")
  }

  document.title = "Create Group"
</script>

<form on:submit|preventDefault={submit} in:fly={{y: 20}}>
  <Content>
    <div class="mb-4 flex flex-col items-center justify-center">
      <Heading>{ucFirst(mode)} Group</Heading>
      <p>Create a private place where members can talk.</p>
    </div>
    <div class="flex w-full flex-col gap-8">
      <Field label="Name">
        <Input bind:value={values.name}>
          <i slot="before" class="fa fa-clipboard" />
        </Input>
        <div slot="info">The name of the group</div>
      </Field>
      <Field label="Picture">
        <ImageInput
          bind:value={values.image}
          icon="image-portrait"
          maxWidth={480}
          maxHeight={480} />
        <div slot="info">A picture for the group</div>
      </Field>
      <Field label="Description">
        <Textarea bind:value={values.description} />
        <div slot="info">The group's decription</div>
      </Field>
      <Field label="Relays">
        <SearchSelect
          multiple
          search={searchRelayUrls}
          bind:value={values.relays}
          termToItem={normalizeRelayUrl}>
          <i slot="before" class="fa fa-clipboard" />
        </SearchSelect>
        <div slot="info">
          Which relays members should publish notes to. For additional privacy, select relays you
          host yourself.
        </div>
      </Field>
      {#if showMembers}
        <Field label="Member List">
          <PersonMultiSelect bind:value={values.members} />
          <div slot="info">All members will receive a fresh invitation with a new key.</div>
        </Field>
      {/if}
      <FieldInline label="Make Public">
        <Toggle disabled={isAlreadyPublic} bind:value={values.isPublic} />
        <div slot="info">
          If enabled, this will generate a public listing for the group. The member list and group
          messages will not be published.
        </div>
      </FieldInline>
      <Anchor tag="button" theme="button" type="submit" class="text-center">Save</Anchor>
    </div>
  </Content>
</form>
