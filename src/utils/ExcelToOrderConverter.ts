import { TableHeaders } from '@/enum/TableHeaders';
import JsBarcode from 'jsbarcode';

export interface Product {
  order_sn: string;
  order_barcode: string;
  product_info: string;
  main_sku: string;
  quantity: number;
  total: string;
  sku_barcode: string;
  checked: boolean;
  productName: string;
  optionName: string;
  optionSku: string;
  quantityChecked: number;
}

export interface Order {
  order_sn: string;
  products: Product[];
}

export class ExcelToOrderConverter {
  public convert(jsonData: any[]): Order[] {
    const orders: Order[] = [];
    const excelHeaders = jsonData[0] as string[];

    const findHeaderIndex = (header: string) => {
      return excelHeaders.findIndex((value) => value === header);
    };

    const orderMap = new Map<string, Product[]>();

    jsonData.slice(1).forEach((row: any) => {
      const order_sn = row[findHeaderIndex('tracking_number')] || '';
      const product_info = row[findHeaderIndex('product_info')] || '';
      const products = this.parseProducts(order_sn, product_info);

      if (!orderMap.has(order_sn)) {
        orderMap.set(order_sn, []);
      }
      const orderProducts = orderMap.get(order_sn);
      if (orderProducts) orderProducts.push(...products);
    });

    orderMap.forEach((products, order_sn) => {
      orders.push({ order_sn, products });
    });

    console.log(orders);

    return orders;
  }

  public parseProducts(order_sn: string, product_info: string): Product[] {
    return product_info.split('\r\n').map((info: string) => {
      const order_barcode = this.generateBarcodeBase64(order_sn);
      const main_sku = this.extractMainSku(info);
      const sku_barcode = this.generateBarcodeBase64(main_sku);
      const quantity = this.extractQuantity(info);
      const price = this.extractPrice(info);
      const total = `$ ${quantity * price}`;
      const productName = this.extractProductName(info);
      const optionName = this.extractOptionName(info);
      const optionSku = this.extractOptionSku(info);


      return {
        order_sn,
        order_barcode: order_barcode,
        product_info: info,
        main_sku,
        quantity,
        total,
        sku_barcode: sku_barcode,
        checked: false,
        productName,
        optionName,
        optionSku,
        quantityChecked: 0
      };
    });
  }

  public getTableHeaders(): TableHeaders[] {
    return [
      TableHeaders.order_sn,
      TableHeaders.product_info,
      TableHeaders.main_sku,
      TableHeaders.quantity,
      TableHeaders.total,
      TableHeaders.checked,
      TableHeaders.quantityChecked
    ];
  }

  public extractMainSku(info: string): string {
    const match = info.match(/商品選項貨號.*?(\d+)/);
    return match ? match[1] : '';
  }

  public extractQuantity(info: string): number {
    const match = info.match(/數量:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  public extractPrice(info: string): number {
    // 更新正則表達式以支持逗號分隔的數字
    const match = info.match(/價格:\s*\$?\s*([\d,]+)/);
    // 移除數字中的逗號並解析為整數
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }  

  public extractProductName(info: string): string {
    const match = info.match(/商品名稱:\s*([^;]+)/);
    return match ? match[1] : '';
  }
  
  public extractOptionName(info: string): string {
    const match = info.match(/商品選項名稱:\s*([^;]+)/);
    return match ? match[1] : '';
  }

  public extractOptionSku(info: string): string {
    const match = info.match(/商品選項貨號:\s*([^;]+)/);
    return match ? match[1].trim() : '';
  }

  public generateBarcodeBase64(text: string, displayValue = false): string {
    if (!text) {
      return ''; // 如果文本为空，返回空字符串
    }
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, text, { format: 'CODE128', displayValue: displayValue });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return ''; // 如果生成条码失败，返回空字符串
    }
  }
}
