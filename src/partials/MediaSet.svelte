<script lang="ts">
  import Media from "src/partials/Media.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let links

  let showModal = false

  const openModal = () => {
    showModal = true
  }

  const closeModal = () => {
    showModal = false
  }
</script>

<div class="my-8 flex justify-center">
  <Anchor theme="button-minimal" on:click={openModal}>
    <i class="fa fa-plus" /> Show all {links.length} link previews
  </Anchor>
</div>

{#if showModal}
  <Modal onEscape={closeModal}>
    <Content>
      {#each links as url}
        <Media {url} />
      {/each}
    </Content>
  </Modal>
{/if}
