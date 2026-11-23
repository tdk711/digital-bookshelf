<script>
  // Brand mark: three white "book spines" on the accent square (matches the
  // full-bleed PWA icons). Sizes are fixed so the mark stays crisp everywhere.
  let { size = 'md', class: cls = '' } = $props()

  const box = {
    xs: 'w-7 h-7 rounded-lg gap-[2px] pb-[6px]',
    sm: 'w-8 h-8 rounded-lg gap-[2px] pb-[7px]',
    md: 'w-10 h-10 rounded-xl gap-[3px] pb-[9px]',
    lg: 'w-12 h-12 rounded-2xl gap-[3px] pb-[11px]'
  }
</script>

<span class="inline-flex items-end justify-center bg-accent shrink-0 {box[size]} {cls}" aria-hidden="true">
  <span class="bg-white w-[14%] h-[46%] rounded-[1px]"></span>
  <span class="bg-white w-[14%] h-[56%] rounded-[1px]"></span>
  <span class="bg-white w-[14%] h-[46%] rounded-[1px]"></span>
</span>
