<template>
  <section class="ui-ledger">
    <slot />
  </section>
</template>

<style scoped>
.ui-ledger {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ui-ledger > :last-child {
  border-bottom: 0;
}
</style>
