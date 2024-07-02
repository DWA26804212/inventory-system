<template>
    <div>
      <h2>掃描條碼</h2>
      <input type="text" v-model="scannedBarcode" @keyup.enter="handleScan" placeholder="掃描條碼"/>
      <div v-if="result">{{ result }}</div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  interface Order {
    id: number;
    name: string;
    sku: string;
  }
  
  const props = defineProps<{ orders: Order[] }>();
  
  const scannedBarcode = ref('');
  const result = ref('');
  
  function handleScan() {
    const order = props.orders.find(order => order.sku === scannedBarcode.value);
    if (order) {
      result.value = `匹配成功: ${order.name} (條碼: ${order.sku})`;
    } else {
      result.value = '無匹配';
    }
    scannedBarcode.value = '';
  }
  </script>
  