<template>
    <div>
      <h2>匯出 PDF</h2>
      <button @click="exportPdf">匯出 PDF</button>
      <div id="pdfContent">
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
                <svg :id="'pdfBarcode' + order.id"></svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted } from 'vue';
  import JsBarcode from 'jsbarcode';
  import html2canvas from 'html2canvas';
  import jsPDF from 'jspdf';
  
  interface Order {
    id: number;
    name: string;
    sku: string;
  }
  
  const props = defineProps<{ orders: Order[] }>();
  
  onMounted(() => {
    props.orders.forEach(order => {
      JsBarcode(`#pdfBarcode${order.id}`, order.sku, {
        format: 'CODE128',
      });
    });
  });
  
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
  