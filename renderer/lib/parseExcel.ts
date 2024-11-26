import * as XLSX from 'xlsx';

// Excelファイルを解析してJSONデータを返す関数
export function parseExcel(file: File): Promise<{}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // 全てのシートを処理
            const FinalSheetsData = {seminer:[],employee:[],contractor:[],humei:[]};
            workbook.SheetNames.forEach((sheetName) => {
                let sheetKey = '';
                switch(sheetName){
                    case 'セミナーリスト':
                        sheetKey = 'seminer';
                        break;
                    case '対象外の受講ユーザー':
                        sheetKey = 'seminer';
                        break;
                    case '職員リスト':
                        sheetKey = 'employee';
                        break;
                    case '委託派遣リスト':
                        sheetKey = 'contractor';
                        break;
                    default:
                        sheetKey = 'humei';
                }
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
                    if(!('syozoku' in row)){
                        row['syozoku'] = row['sisetu']+row['busyo']; 
                    }
                    if(!('tiku' in row) && ('sisetu' in row) && ('busyo' in row)){
                        switch(row['sisetu']){
                            case '東病院':
                                row['tiku'] = "柏";
                                break;
                            case '中央病院':
                                row['tiku'] = "築地";
                                break;
                            default:
                                if((row['sisetu']).toString().indexOf('築地') > -1){
                                    row['tiku'] = "築地";
                                }else if((row['sisetu']).toString().indexOf('柏') > -1){
                                    row['tiku'] = "柏";
                                }else{
                                    row['tiku'] = row['busyo'];
                                }
                                break;
                        }
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
                FinalSheetsData[sheetKey].push(...jsonData);
            });
            resolve(FinalSheetsData);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}
