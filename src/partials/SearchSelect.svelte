<script lang="ts">
  import {reject, equals, identity} from "ramda"
  import Chip from "src/partials/Chip.svelte"
  import Input from "src/partials/Input.svelte"
  import Suggestions from "src/partials/Suggestions.svelte"

  export let value
  export let placeholder = ""
  export let delimiters = []
  export let search = null
  export let termToItem = null
  export let getKey: (x: any) => any = identity
  export let autofocus = null
  export let multiple = false
  export let defaultOptions = []

  let term = multiple ? "" : getKey(value)
  let input
  let suggestions
  let focused = false

  $: suggestions?.setData(term ? search(term).slice(0, 10) : defaultOptions)

  const create = term => {
    select(termToItem(term))
  }

  const remove = item => {
    value = multiple ? reject(equals(item), value) : null
  }

  const select = item => {
    if (multiple) {
      value = value.concat([item])
      term = ""
    } else {
      value = item
      term = getKey(item)
      focused = false
    }
  }

  const onKeyDown = event => {
    if (term && termToItem && delimiters.includes(event.key)) {
      event.preventDefault()
      create(term)
    }

    if (event.key === "Escape") {
      event.stopPropagation()
      term = ""
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (suggestions.get()) {
        select(suggestions.get())
      } else if (term && termToItem) {
        create(term)
      }
    }

    if (suggestions?.get() && event.code === "ArrowUp") {
      event.preventDefault()
      suggestions.prev()
    }

    if (suggestions?.get() && event.code === "ArrowDown") {
      event.preventDefault()
      suggestions.next()
    }
  }

  const onFocus = () => {
    focused = true
  }

  const onBlur = () => {
    setTimeout(() => {
     focused = false

     if (multiple) {
        term = ""
      }
    }, 100)
  }
</script>

{#if multiple}
  <div class="text-sm">
    {#each value as item}
      <Chip class="mb-1 mr-1" theme="dark" onRemove={() => remove(item)}>
        <slot name="item" context="value" {item}>
          {item}
        </slot>
      </Chip>
    {/each}
  </div>
{/if}

<Input
  class="cursor-text text-black outline-0"
  {autofocus}
  {placeholder}
  bind:value={term}
  bind:element={input}
  on:keydown={onKeyDown}
  on:focus={onFocus}
  on:blur={onBlur}
  hideBefore={!$$slots.before}>
  <slot slot="before" name="before" />
  <div slot="after" on:click={() => input.focus()}>
    {#if defaultOptions.length > 0}
      <div class="cursor-pointer">
        <i class="fa fa-caret-down" />
      </div>
    {/if}
  </div>
</Input>

{#if focused}
  <div class="relative w-full">
    <div class="absolute z-10 w-full">
      <Suggestions
        bind:this={suggestions}
        create={termToItem ? create : null}
        {select}
        {term}
        {getKey}>
        <div slot="item" let:item>
          <slot name="item" context="option" {item}>
            {item}
          </slot>
        </div>
      </Suggestions>
    </div>
  </div>
{/if}
