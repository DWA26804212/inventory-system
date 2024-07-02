<template>
  <div>
    <ImportExcel @file-imported="handleFileImported"/>
    <BarcodeDisplay v-if="orders.length" :orders="orders"/>
    <PdfExport v-if="orders.length" :orders="orders"/>
    <BarcodeScanner v-if="orders.length" :orders="orders"/>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ImportExcel from '@/components/ImportExcel.vue';
import BarcodeDisplay from '@/components/BarcodeDisplay.vue';
import PdfExport from '@/components/PdfExport.vue';
import BarcodeScanner from '@/components/BarcodeScanner.vue';

interface Order {
  id: number;
  name: string;
  sku: string;
}

const orders = ref<Order[]>([]);

function handleFileImported(data: any[]) {
  console.log('handleFileImported', data);
  orders.value = data.map((row, index) => ({
    id: index,
    name: row[0],
    sku: row[1],
  }));
}
</script>
