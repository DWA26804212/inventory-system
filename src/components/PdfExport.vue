<template>
  <div id="pdfContent">
    <div v-for="(order, index) in orders" :key="index" class="order-container">
      <h3>訂單編號: {{ order.order_sn }}</h3>
      <img :src="order.products[0]?.order_barcode" alt="Order Barcode" class="order-barcode" />
      <table class="order-table" border="1">
        <thead>
          <tr class="text-center">
            <th>#</th>
            <th>主商品貨號</th>
            <th>商品名稱</th>
            <th>商品選項貨號</th>
            <th>商品規格名稱</th>
            <th>數量</th>
            <th>總計</th>
          </tr>
        </thead>
        <tbody>
          <tr class="eachItem" v-for="(product, idx) in order.products" :key="idx">
            <td class="text-center">{{ idx + 1 }}</td>
            <td>
              {{ product.main_sku }}
              <img :src="product.sku_barcode" alt="Product Barcode" class="product-barcode" />
            </td>
            <td>{{ product.productName }}</td>
            <td>{{ product.optionSku }}</td>
            <td>{{ product.optionName }}</td>
            <td class="text-center">{{ product.quantity }}</td>
            <td class="text-center">{{ product.total }}</td>
          </tr>
        </tbody>
      </table>
      <!-- <p>買家備註:</p> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Order } from '@/utils/ExcelToOrderConverter';

const props = defineProps<{ orders: Order[] }>();

async function exportPdf() {
  const element = document.getElementById('pdfContent');
  if (element) {
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 190; // 設置 PDF 中圖像的寬度
    const pageHeight = 295; // A4 頁面的高度
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10; // 初始位置

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('orders.pdf');
  }
}
</script>

<style scoped>

/* #pdfContent {
  font-size: 0.8em;
} */

.order-barcode {
  width: 200px;
  height: auto;
}

.order-table {
  border-collapse: collapse;
  margin-top: 10px;
  table-layout: fixed;
}

.order-table th, .order-table td {
  padding: 5px;
}

.text-center {
  text-align: center;
  white-space: nowrap;
}

.product-barcode {
  width: 150px;
  height: auto;
}

@media print {
  body {
    -webkit-print-color-adjust: exact;
  }

  .order-container + .order-container {
    page-break-before: always; /* 在每个订单容器前强制分页 */
  }

  .eachItem {
    page-break-inside: avoid;
  }
}
</style>
