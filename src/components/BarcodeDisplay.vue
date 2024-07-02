<template>
    <div>
      <h2>條碼顯示</h2>
      <table v-if="orders.length">
        <thead>
          <tr>
            <th>商品名稱</th>
            <th>貨號</th>
            <th>條碼</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.name }}</td>
            <td>{{ order.sku }}</td>
            <td>
              <svg :id="'barcode' + order.id"></svg>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, PropType } from 'vue';
  import JsBarcode from 'jsbarcode';
  
  interface Order {
    id: number;
    name: string;
    sku: string;
  }
  
  const props = defineProps<{ orders: Order[] }>();
  
  onMounted(() => {
    props.orders.forEach(order => {
      JsBarcode(`#barcode${order.id}`, order.sku, {
        format: 'CODE128',
      });
    });
  });
  </script>
  