import { stringify } from 'querystring';
import * as XLSX from 'xlsx';

// Excelファイルを解析してJSONデータを返す関数
export function parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // 全てのシートを処理
            const allSheetsData: any[] = [];
            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

                // 各セル内の改行やスペースを処理
                let isExistHeadBefGyousyu = false;
                let befogyousyu = '';
                jsonData.forEach((row:any[]) => {
                    if ('gyousyu' in row){
                        isExistHeadBefGyousyu = true;
                        befogyousyu = row['gyousyu'].toString() ;
                    }
                    if(isExistHeadBefGyousyu && !('gyousyu' in row)){
                        row['gyousyu'] = befogyousyu; 
                    }
                    for (let key in row) {
                        if (typeof row[key] === 'string') {
                            row[key] = row[key]
                            .replace(/[\r\n]/g, '_]')           // 改行を「_]」に置き換え
                            .replace(/　/g, ' ')               // 全角スペースを半角スペースに置き換え
                            .replace(/\s{2,}/g, ' ')           // 連続するスペースを1つの半角スペースに圧縮
                            .trim();        
                        }
                    }
                });

                allSheetsData.push(...jsonData);
            });
            resolve(allSheetsData);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}
