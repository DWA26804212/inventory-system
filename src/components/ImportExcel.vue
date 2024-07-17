<template>
  <div v-show="displayMainView">
    <h2>匯入 Excel 檔</h2>
    <el-upload class="upload-demo" action="" :http-request="handleFileUpload" :file-list="fileList" drag>
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">將文件拖到此處，或<em>點擊上傳</em></div>
    </el-upload>
    <div class="search-container">
      <el-form :model="ruleForm" :rules="rules" ref="ruleFormRef">
        <el-form-item>
          <el-col :span="5">
            <el-form-item class="p-2" prop="orderSn">
              <el-input v-model="ruleForm.orderSn" placeholder="輸入訂單編號" clearable
                @keyup.enter="checkField('orderSn')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="2" class="button-col">
            <el-button type="primary" @click="checkField('orderSn')">搜尋單號</el-button>
          </el-col>
          <el-col :span="5" class="p-2">
            <el-input v-model="orderSnDisplay" :disabled="true"></el-input>
          </el-col>
          <el-col :span="5">
            <el-form-item class="p-2" prop="barcode">
              <el-input ref="barcodeInputRef" v-model="ruleForm.barcode" placeholder="輸入商品貨號" clearable
                @keyup.enter="checkField('barcode')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="2" class="button-col">
            <el-button type="primary" @click="checkField('barcode')">搜尋貨號</el-button>
          </el-col>
          <el-col :span="5" class="p-2">
            <el-input v-model="barcodeDisplay" :disabled="true"></el-input>
          </el-col>
        </el-form-item>
      </el-form>
    </div>
    <el-table v-if="tableData.length" :data="tableData" :span-method="arraySpanMethod" table-layout="auto"
      :row-class-name="tableRowClassName">
      <el-table-column v-for="(header, index) in tableHeaders" :key="index" :prop="header" :label="header"
        min-width="80">
        <template v-slot="scope">
          <div class="order-container" v-if="header === TableHeaders.order_sn">
            <span :id="'order-' + scope.row.order_sn">{{ scope.row.order_sn }}</span>
            <img class="barcode-img" :src="scope.row.order_barcode" alt="order_barcode" />
          </div>
          <div class="sku-container" v-else-if="header === TableHeaders.main_sku">
            <span :id="'sku-' + scope.row.order_sn + scope.row.main_sku">{{ scope.row.main_sku }}</span>
            <img class="barcode-img" :src="scope.row.sku_barcode" alt="sku_barcode" />
          </div>
          <div class="text-center quantity p-2" v-else-if="header === TableHeaders.quantity">
            {{ scope.row.quantity }}
          </div>
          <div class="text-center p-2" v-else-if="header === TableHeaders.total">
            {{ scope.row.total }}
          </div>
          <div class="custom-checkbox text-center p-2" v-else-if="header === TableHeaders.checked">
            <input type="checkbox" :id="'checkbox-' + scope.$index" v-model="scope.row.checked" />
            <label :for="'checkbox-' + scope.$index">已確認</label>
          </div>
          <div class="text-center p-2" v-else-if="header === TableHeaders.quantityChecked">
            <el-input v-model="scope.row.quantityChecked" type="number" @input="changeQuantityChecked(scope.row)"
              :formatter="quantityCheckedFormatter" style="width: 80px" :id="'QCInput-' + scope.$index"></el-input>
          </div>
          <span v-else>{{ scope.row[TableHeaders.getStatusKeyByValue(header) ?? ''] }}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="button-container">
      <el-button type="primary" @click="takeScreenshot">截圖存檔</el-button>
      <!-- <el-button type="primary" @click="downloadPDF">下載PDF</el-button> -->
      <el-button type="primary" @click="printPage">下載PDF</el-button>
      <el-button type="primary" @click="checkAllOrder">檢查未完成之訂單</el-button>
    </div>
    <div v-if="incompleteOrders.length" class="incomplete-orders" ref="incompleteOrdersRef">
      <h3>未完成之訂單號:</h3>
      <ul>
        <li v-for="orderSn in incompleteOrders" :key="orderSn" @click="scrollToOrder(null, orderSn, () => { })">
          <a href="javascript:void(0)">{{ orderSn }}</a>
        </li>
      </ul>
    </div>
  </div>

  <PdfExport :orders="orders" v-show="displayPdfContent" />
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import * as XLSX from 'xlsx';
import { ExcelToOrderConverter, Order, Product } from '@/utils/ExcelToOrderConverter';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { ElMessage, ElTable, FormInstance, FormRules } from 'element-plus';
import { jsPDF } from 'jspdf';
import { TableHeaders } from '@/enum/TableHeaders';
import PdfExport from '@/components/PdfExport.vue';

interface RuleForm {
  orderSn: string
  barcode: string
}

const tableData = ref<Product[]>([]);
const converter = new ExcelToOrderConverter();
const tableHeaders = ref<TableHeaders[]>(converter.getTableHeaders());
const fileList = ref<any[]>([]);
const importTimestamp = ref('');
const originalFileName = ref('');
const highlightedOrderSn = ref<string | null>(null);
let orders: Order[] = [];
const displayMainView = ref(true);
const displayPdfContent = ref(false);
const incompleteOrders = ref<string[]>([]);
const incompleteOrdersRef = ref<HTMLElement | null>(null);
const orderSnDisplay = ref('');
const barcodeDisplay = ref('');
const barcodeInputRef = ref<HTMLElement | null>(null);

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  orderSn: '',
  barcode: ''
})

const rules = reactive<FormRules<RuleForm>>({
  orderSn: [
    { validator: scrollToOrder, trigger: 'submit' }
  ],
  barcode: [
    { validator: scanBarcode, trigger: 'submit' }
  ]
});

function scrollToOrder(rule: any, value: any, callback: any) {
  console.log('searchOrderSn', value);
  orderSnDisplay.value = value;
  ruleForm.orderSn = '';

  const orderElement = document.getElementById('order-' + value);
  if (orderElement) {
    setTimeout(() => {
      orderElement.scrollIntoView({ behavior: 'smooth' });
      highlightedOrderSn.value = value;
      // 聚焦掃描商品條碼的輸入欄位
      barcodeInputRef.value?.focus();
      callback();
    }, 10);
  } else {
    highlightedOrderSn.value = '';
    const msg = '查無此訂單編號';
    console.error(msg);
    callback(new Error(msg))
  }
}

function scanBarcode(rule: any, value: any, callback: any) {
  console.log('scanBarcode', value);
  barcodeDisplay.value = value;
  ruleForm.barcode = '';

  const ordersFromTableData = tableData.value.filter(product => product.order_sn === highlightedOrderSn.value?.trim());

  if (ordersFromTableData.some(order => order.main_sku === value)) {
    setTimeout(() => {
      const skuElement = document.getElementById('sku-' + highlightedOrderSn.value + value);
      skuElement?.scrollIntoView({ behavior: 'smooth' });
      ordersFromTableData.forEach(order => {
        if (order.main_sku === value) {
          order.quantityChecked = quantityCheckedFormatter(order.quantityChecked) + 1;
          if (order.quantityChecked === order.quantity) {
            order.checked = true;
          } else {
            order.checked = false;
          }
        }
      });
      callback();
    }, 10);

  } else {
    const msg = '查無此商品貨號';
    console.error(msg);
    return callback(new Error(msg));
  }
}

function changeQuantityChecked(product: Product) {
  const quantity = quantityCheckedFormatter(product.quantityChecked)
  if (product.quantity === quantity) {
    product.checked = true;
  } else {
    product.checked = false;
  }
}

function checkField(field: string) {
  console.log('checkField', field);
  ruleFormRef.value?.validateField(field);
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/T/, ' ').replace(/:\d+\..+/, '');
}

// test();

function test() {
  console.log('test');

  const testJson = '[["tracking_number","order_sn","product_info","remark_from_buyer","seller_note"],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","240630BSP19QWV","[1] 商品名稱:【BabyHug】純淨濕紙巾 純水濕紙巾 嬰兒濕巾 低過敏 80抽/包｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:80抽/包; 價格: $ 39; 數量: 10; 商品選項貨號: 4719878681179; 主商品貨號: 4719878681179; \\r\\n[2] 商品名稱:【芊柔】抗病毒植萃濕巾 10抽 嬰兒濕紙巾 擦拭巾 濕拖巾 柔濕巾｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:數量下10; 價格: $ 15; 數量: 11; 商品選項貨號: 4713213502426\\n(數量10包); ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177; \\r\\n[2] 商品名稱:現貨【唐鑫 生發 醫強 克司博】75%酒精 醫用酒精 酒精清潔液 4000ml｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:隨機出貨不挑款 4000ml; 價格: $ 260; 數量: 1; 商品選項貨號: 唐鑫4712352970417\\n生發4711200887549\\n醫強\\n4719873171132; 主商品貨號: 4712352970417; ","",""],["","2406288AHRAYWX","[1] 商品名稱:特價現貨💥【順易利】醫用口罩 成人平面口罩 雙鋼印 50入 藍｜盈盈藥局＆實體店面藥師團隊經營; 商品選項名稱:藍-50入; 價格: $ 69; 數量: 2; 商品選項貨號: 舊4711182568177\\n新4711182561741; 主商品貨號: 4711182568177;  ","",""]]'
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

async function downloadPDF() {
  const doc = new jsPDF();
  const imgWidth = 190; // 設置 PDF 中圖像的寬度
  const pageHeight = 275; // A4 頁面的高度
  const halfPageHeight = pageHeight / 2; // A4 頁面的一半高度
  // let currentY = 10; // 初始位置
  let currentH = 0;

  try {
    for (let index = 0; index < orders.length; index++) {
      const order = orders[index];
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.padding = '10px';

      const orderInfo = `
        <h3>訂單編號: ${order.order_sn}</h3>
        <img src="${order.products.at(0)?.order_barcode}" alt="Order Barcode" style="width: 200px; height: auto;"/>
        <table border="1" style=" border-collapse: collapse; margin-top: 10px; table-layout: fixed;">
          <thead>
            <tr style="white-space: nowrap;">
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
            ${order.products.map((product, idx) => {
        return `
                <tr>
                  <td style="text-align: center; padding: 5px;">${idx + 1}</td>
                  <td>
                    ${product.main_sku}
                    <img src="${product.sku_barcode}" alt="Product Barcode" style="width: 150px; height: auto;"/>
                  </td>
                  <td>${product.productName}</td>
                  <td>${product.optionSku}</td>
                  <td>${product.optionName}</td>
                  <td style="text-align: center;">${product.quantity}</td>
                  <td style="white-space: nowrap; text-align: center">${product.total}</td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
        <p>買家備註:</p>
      `;

      container.innerHTML = orderInfo;

      // Append the container to the body
      document.body.appendChild(container);

      // Use html2canvas to capture the element
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      // Remove the container from the body
      document.body.removeChild(container);

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (currentH + imgHeight <= halfPageHeight) {
        // If current order image height is less than half page height and there's enough space on current page
        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        currentH += imgHeight; // Update current Y position for next order
      } else if (imgHeight <= halfPageHeight && (pageHeight - currentH) >= halfPageHeight) {
        // If the image height is less than half page height and there is half page space left on current page
        doc.addImage(imgData, 'PNG', 10, halfPageHeight, imgWidth, imgHeight);
        currentH = pageHeight; // Update current Y position for next order
      } else {
        // If there is not enough space on current page, add new page
        if (index > 0) doc.addPage();
        currentH = 0;
        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        currentH += imgHeight; // Update current Y position for next order

        let heightLeft = imgHeight;
        let position = 10; // 初始位置

        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

      }
    }

    const currentTime = formatDate(new Date()); // 當下儲存時間
    const fileName = `${originalFileName.value}_${importTimestamp.value}_to_${currentTime}.pdf`; // 組合檔名
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating or saving PDF:', error);
  }
}

const printPage = () => {
  displayMainView.value = false;
  displayPdfContent.value = true;
  setTimeout(() => {
    window.print();
    displayMainView.value = true;
    displayPdfContent.value = false;
  }, 100);
};

function checkAllOrder() {
  incompleteOrders.value = []; // 清空之前的未完成訂單

  if (tableData.value.length === 0) {
    ElMessage({
      message: '無訂單資料',
      type: 'warning',
    });
    return;
  }

  // 遍歷所有訂單，檢查是否有未完成的
  const uniqueOrderSn = new Set<string>();
  tableData.value.forEach(product => {
    if (!product.checked) {
      uniqueOrderSn.add(product.order_sn);
    }
  });

  // 將未完成訂單號保存到 incompleteOrders
  incompleteOrders.value = Array.from(uniqueOrderSn);

  // 若有未完成之訂單號，滑動到顯示訂單號的地方
  if (incompleteOrders.value.length > 0) {
    setTimeout(() => {
      console.log('incompleteOrders', incompleteOrders.value);
      const incompleteOrderElement = incompleteOrdersRef.value;
      if (incompleteOrderElement) {
        incompleteOrderElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  } else {
    // 若無未完成之訂單，顯示所有訂單已確認
    ElMessage({
      message: '所有訂單已確認',
      type: 'success',
    });
  }
}

const quantityCheckedFormatter = (value: string | number) => {
  // 將值轉換為數字型態，若為空值則回傳 0
  const numberValue = Number(value);
  return isNaN(numberValue) || value === '' ? 0 : numberValue;
};

</script>

<style scoped>
.upload-demo {
  margin-top: 53px;
}

.search-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding-top: 10px;
}

.barcode-img {
  max-width: 250px;
  width: 100%;
  height: auto;
}

.button-container {
  margin: 20px;
}

.order-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.sku-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.el-table ::v-deep .highlighted-row {
  background-color: rgb(177, 249, 201);
}

.el-table {
  --el-table-row-hover-bg-color: transparent;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
}

.custom-checkbox input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 24px;
  /* 调整宽度 */
  height: 24px;
  /* 调整高度 */
  border: 2px solid #42b983;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  position: relative;
  outline: none;
  transition: background-color 0.3s, border-color 0.3s;
}

.custom-checkbox input[type="checkbox"]:checked {
  background-color: #42b983;
  border-color: #42b983;
}

.custom-checkbox input[type="checkbox"]:checked::before {
  content: '✔';
  display: block;
  color: white;
  font-size: 18px;
  /* 调整对勾的大小 */
  text-align: center;
  line-height: 24px;
  /* 调整对勾的垂直对齐 */
}

.custom-checkbox label {
  font-size: 16px;
  /* 调整标签的字体大小 */
  color: #666;
}

.incomplete-orders {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.incomplete-orders h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #333;
}

.incomplete-orders ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.incomplete-orders li {
  margin: 5px 0;
}

.incomplete-orders li a {
  color: #409EFF;
  text-decoration: none;
  cursor: pointer;
}

.incomplete-orders li a:hover {
  text-decoration: underline;
}

.button-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-center {
  text-align: center;
  white-space: nowrap;
}

.quantity {
  min-width: 30px;
}
</style>
