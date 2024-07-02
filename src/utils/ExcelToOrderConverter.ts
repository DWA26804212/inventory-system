import JsBarcode from 'jsbarcode';

export interface Product {
  product_info: string;
  main_sku: string;
  quantity: number;
  total: string;
  barcode: string;
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
      const order_sn = row[findHeaderIndex('order_sn')] || '';
      const product_info = row[findHeaderIndex('product_info')] || '';
      const products = this.parseProducts(product_info);

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

  public parseProducts(product_info: string): Product[] {
    return product_info.split('\r\n').map((info: string) => {
      const main_sku = this.extractMainSku(info);
      const quantity = this.extractQuantity(info);
      const price = this.extractPrice(info);
      const total = `$ ${quantity * price}`;
      const barcode = this.generateBarcodeBase64(main_sku);

      return {
        product_info: info,
        main_sku,
        quantity,
        total,
        barcode,
      };
    });
  }

  public getTableHeaders(): string[] {
    return ['order_sn', ...Object.keys(this.parseProducts('')[0])] as string[];
  }

  private extractMainSku(info: string): string {
    const match = info.match(/商品選項貨號.*?(\d+)/);
    return match ? match[1] : '';
}

  private extractQuantity(info: string): number {
    const match = info.match(/數量:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private extractPrice(info: string): number {
    const match = info.match(/價格:\s*\$?\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  public generateBarcodeBase64(text: string): string {
    if (!text) {
      return ''; // 如果文本为空，返回空字符串
    }
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, text, { format: 'CODE128' });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating barcode:', error);
      return ''; // 如果生成条码失败，返回空字符串
    }
  }
}
