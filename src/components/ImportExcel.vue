<template>
  <div>
    <h2>匯入 Excel 檔</h2>
    <el-upload class="upload-demo" action="" :http-request="handleFileUpload" :file-list="fileList" drag>
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">將文件拖到此處，或<em>點擊上傳</em></div>
    </el-upload>
    <div class="search-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchOrderSn" placeholder="輸入單號" clearable @keyup.enter="scrollToOrder"></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="scrollToOrder">搜尋單號</el-button>
        </el-col>
        <el-col :span="6">
          <el-input v-model="scannedBarcode" placeholder="掃描商品條碼" clearable @keyup.enter="scanBarcode"></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="scanBarcode">掃描條碼</el-button>
        </el-col>
      </el-row>
    </div>
    <el-table v-if="tableData.length" :data="tableData" :span-method="arraySpanMethod"
      :row-class-name="tableRowClassName">
      <el-table-column v-for="(header, index) in tableHeaders" :key="index" :prop="header" :label="header">
        <template v-slot="scope">
          <div class="order-container" v-if="header === 'order_sn'">
            <span :id="'order-' + scope.row.order_sn">{{ scope.row.order_sn }}</span>
            <img class="barcode-img" :src="converter.generateBarcodeBase64(scope.row.order_sn)" alt="barcode" />
          </div>
          <img class="barcode-img" v-else-if="header === 'barcode'" :src="scope.row[header]" alt="barcode" />
          <el-checkbox class="custom-checkbox" v-else-if="header === 'checked'" v-model="scope.row.checked" label="已確認"
            size="large"></el-checkbox>
          <span v-else>{{ scope.row[header] }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="screenshot-container">
      <el-button type="primary" @click="takeScreenshot">截圖並儲存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import { ExcelToOrderConverter, Order, Product } from '@/utils/ExcelToOrderConverter';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { ElTable } from 'element-plus'

const tableData = ref<Product[]>([]);
const converter = new ExcelToOrderConverter();
const tableHeaders = ref<string[]>(converter.getTableHeaders());
const fileList = ref<any[]>([]);
const searchOrderSn = ref<string>('');
const importTimestamp = ref('');
const originalFileName = ref('');
const highlightedOrderSn = ref<string | null>(null);
let orders: Order[] = [];
const scannedBarcode = ref<string>('');

function formatDate(date: Date): string {
  return date.toISOString().replace(/T/, ' ').replace(/:\d+\..+/, '');
}

test();

function test() {
  console.log('test');

  const testJson = '[["tracking_number","order_sn","product_info","remark_from_buyer","seller_note"],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","240630BSP19QWV","[1] 商品名稱:【BabyHug】純淨濕紙巾 純水濕紙巾 嬰兒濕巾 低過敏 80抽/包｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:80抽/包; 價格: $ 39; 數量: 10; 商品選項貨號: 4719878681179; 主商品貨號: 4719878681179; \\r\\n[2] 商品名稱:【芊柔】抗病毒植萃濕巾 10抽 嬰兒濕紙巾 擦拭巾 濕拖巾 柔濕巾｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:數量下10; 價格: $ 15; 數量: 11; 商品選項貨號: 4713213502426\\n(數量10包); ","",""]]'
  const json = JSON.parse(testJson);
  console.log('testJson', json);

  orders = converter.convert(json);
  tableData.value = orders.flatMap(order =>
    order.products.map((product, index) => ({
      ...product,
      rowspan: index === 0 ? order.products.length : 0
    }))
  );

  console.log('tableData', tableData.value);
}

function handleFileUpload(param: any) {
  const file = param.file;
  importTimestamp.value = formatDate(new Date()); // 記錄匯入時間
  originalFileName.value = file.name.replace(/\.[^/.]+$/, ""); // 記錄原始檔名（不含副檔名）

  if (file) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      console.log('ExcelData', jsonData);

      if (jsonData.length > 0) {
        orders = converter.convert(jsonData);
        tableData.value = orders.flatMap(order =>
          order.products.map((product, index) => ({
            ...product,
            rowspan: index === 0 ? order.products.length : 0
          }))
        );

        console.log('tableData', tableData.value);
        fileList.value = [param.file];
      } else {
        console.error('Parsed JSON data is empty.');
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

function arraySpanMethod({ row, column, rowIndex, columnIndex }: any) {
  if (columnIndex === 0) {
    const rowspan = row.rowspan;
    if (rowspan > 0) {
      return {
        rowspan: rowspan,
        colspan: 1
      };
    } else {
      return {
        rowspan: 0,
        colspan: 0
      };
    }
  }
}

function scrollToOrder() {
  const orderElement = document.getElementById('order-' + searchOrderSn.value);
  if (orderElement) {
    orderElement.scrollIntoView({ behavior: 'smooth' });
    highlightedOrderSn.value = searchOrderSn.value;
  } else {
    console.error('找不到該單號的資料');
  }
}

async function takeScreenshot() {
  const element = document.querySelector('.el-table') as HTMLElement;
  if (element) {
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const currentTime = formatDate(new Date()); // 當下儲存時間
    const fileName = `${originalFileName.value}_${importTimestamp.value}_to_${currentTime}.png`; // 組合檔名
    saveAs(imgData, fileName);
  }
}

function tableRowClassName({ row }: any) {
  return row.order_sn === highlightedOrderSn.value ? 'highlighted-row' : '';
}

function scanBarcode() {
  const ordersFromTableData = tableData.value.filter(product => product.order_sn === highlightedOrderSn.value);

  if (ordersFromTableData.length === 0) {
    console.error('找不到該條碼的訂單');
    return;
  }

  ordersFromTableData.forEach(order => {
    if (order.main_sku === scannedBarcode.value)
      order.checked = true;
  });
}

</script>

<style scoped>
.upload-demo {
  margin-bottom: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.barcode-img {
  max-width: 200px;
  width: 100%;
  height: auto;
}

.screenshot-container {
  margin-top: 20px;
}

.order-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-table ::v-deep .highlighted-row {
  background-color: rgb(122, 225, 157);
}

.el-table {
  --el-table-row-hover-bg-color: transparent;
}

.el-checkbox {
  position: relative;
  text-align: center;
  background-color: #fff;
  border-radius: 2px;

}

.el-checkbox.is-checked {
  color: #1890ff;
  border: 1px solid #1890ff;
}

.is-checked:before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  border: 7px solid #1890ff;
  border-bottom-color: transparent;
  border-left-color: transparent;
}

.is-checked:after {
  content: '';
  width: 1px;
  height: 3px;
  position: absolute;
  right: 1px;
  top: 0;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-left-color: transparent;
  transform: rotate(45deg);
}
</style>
