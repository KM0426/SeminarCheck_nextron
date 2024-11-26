import * as XLSX from 'xlsx';
import  saveAs  from 'file-saver';
import Button from '@mui/material/Button';


export function TempDownloadButton() {
  const handleDownloadClick = () => {
    const worksheet1 = XLSX.utils.json_to_sheet([],{header:["datetime","no","shisetu","bumon","syokumei","name","mail","taisyoku","seminajukou","douga","syoutesuto","jukouno"]});
    const worksheet2 = XLSX.utils.json_to_sheet([],{header:["no","sisetu","bumon","syokumei","name","mail","taisyoku","jukouno"]});
    const worksheet3 = XLSX.utils.json_to_sheet([],{header:["no","state","kubun","tiku","syozokuno","syozoku","syokumei","syokusyu","name","hurigana"]});
    const worksheet4 = XLSX.utils.json_to_sheet([],{header:["no","kubun","kaisyamei","gyousyu","sekininsya","mibun","name","hurigana","seibetu","syozoku","mail","namecard","kanribumon"]});
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'セミナーリスト');
    XLSX.utils.book_append_sheet(workbook, worksheet2, '対象外の受講ユーザー');
    XLSX.utils.book_append_sheet(workbook, worksheet3, '職員リスト');
    XLSX.utils.book_append_sheet(workbook, worksheet4, '委託派遣リスト');
    const excelUnit8Array = XLSX.write(workbook, { type: 'array' });
    const excelBlob = new Blob([excelUnit8Array],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    saveAs(excelBlob, 'template');
  };

  return (
    <Button onClick={handleDownloadClick}>
      DL：temp_SeminarUser
    </Button>
  );
}
