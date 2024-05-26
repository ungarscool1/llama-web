<script lang="ts">
  export let message = '';
  export let role = 'user';
</script>
{#if role === 'user'}
<div class="w-full">
  <div class="py-2 px-3 text-base md:px-4 m-auto md:px-5 lg:px-1 xl:px-5">
    <div class="mx-auto flex flex-1 gap-3 text-base md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
      <div class="relative flex w-full min-w-0 flex-col">
        <div class="flex-col gap-1 md:gap-3">
          <div class="flex flex-grow flex-col max-w-full">
            <div class="min-h-[20px] flex flex-col items-start whitespace-pre-wrap break-words overflow-x-auto gap-2">
              <div class="flex w-full flex-col gap-1 items-end">
                <div class="relative max-w-[70%] rounded-3xl bg-[#f4f4f4] px-5 py-2.5 dark:bg-background">{message}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{:else}
<div class="w-full">
  <div class="py-2 px-3 text-base md:px-4 m-auto md:px-5 lg:px-1 xl:px-5">
    <div class="mx-auto flex flex-1 gap-3 text-base md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
      <div class="relative flex w-full min-w-0 flex-col">
        <div class="flex-col gap-1 md:gap-3">
          <div class="flex flex-grow flex-col max-w-full">
            <div class="min-h-[20px] text-message flex flex-col items-start whitespace-pre-wrap break-words overflow-x-auto gap-2">
              <div class="flex w-full flex-col gap-1 items-start">
                <div class="relative max-w-[70%] rounded-3xl bg-[#f4f4f4] px-5 py-2.5 dark:bg-background">{message}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}