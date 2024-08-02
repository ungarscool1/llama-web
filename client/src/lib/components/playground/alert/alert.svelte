<script lang="ts">
  import * as Alert from "$lib/components/ui/alert";
  import CircleAlert from "lucide-svelte/icons/circle-alert";
  export let errorMessage = '';
</script>
<Alert.Root class="text-red-500 bg-transparent border-0">
  <Alert.Description class="flex flex-row">
    <CircleAlert class="size-5 mr-5" />
    <p>{errorMessage}</p>
  </Alert.Description>
</Alert.Root>