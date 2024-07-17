export enum TableHeaders {
    order_sn = '訂單編號',
    product_info = '商品資訊',
    main_sku = '主商品貨號',
    quantity = '數量',
    total = '金額',
    checked = '確認'
}

export namespace TableHeaders {
    export function getStatusKeyByValue(value: string): string | undefined {
        return Object.keys(TableHeaders).find(key => TableHeaders[key as keyof typeof TableHeaders] === value);
    }
    
}