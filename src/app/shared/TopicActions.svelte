<script lang="ts">
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/router"
  import {canSign} from "src/engine"

  export let topic

  let actions = []

  $: {
    actions = []

    if ($canSign) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "t", value: topic}).open(),
        label: "Add to list",
        icon: "scroll",
      })
    }
  }
</script>

<OverflowMenu {actions} />
