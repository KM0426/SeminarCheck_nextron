import React, { useState } from 'react';
import Head from 'next/head';
import { parseExcel } from '../lib/parseExcel';
import { reconcileData } from '../lib/reconcileData';
import { Typography, Box, Card, CardContent, CardActions, CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel } from '@mui/material';
import { styled } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridCsvExportOptions,
    GridCsvGetRowsToExportParams,
    gridSortedRowIdsSelector,
    GridToolbarContainer,
    gridExpandedSortedRowIdsSelector,
    useGridApiContext,
    
} from '@mui/x-data-grid';
import Link from '../components/Link';
import { createSvgIcon } from '@mui/material/utils';
import Button from '@mui/material/Button';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import {TempDownloadButton} from '../lib/ExcelDownloadButton';

const Root = styled('div')(({ theme }) => ({
    textAlign: 'center',
    padding: theme.spacing(4),
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
}));

const ExportIcon = createSvgIcon(
    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />,
    'SaveAlt'
);

const getUnfilteredRows = ({ apiRef }: GridCsvGetRowsToExportParams) =>
    gridSortedRowIdsSelector(apiRef);

const getFilteredRows = ({ apiRef }: GridCsvGetRowsToExportParams) =>
    gridExpandedSortedRowIdsSelector(apiRef);

function CustomToolbar({
    updateChart,
    updatePieChart,
}: {
    updateChart: (data: any[]) => void;
    updatePieChart: (data: any[]) => void;
}) {
    const apiRef = useGridApiContext();

    const handleExportWithUtf8Bom = (options: GridCsvExportOptions) => {
        const csvData = apiRef.current.getDataAsCsv(options);
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvData], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const updateChartData = () => {
        const csvData = apiRef.current.getDataAsCsv({
            delimiter: ',',
        });

        const rows = csvData
            .split('\n')
            .slice(1)
            .map((line) => line.split(',').map((cell) => cell.replace(/"/g, '').trim()))
            .filter((row) => row[4] && row[7]);

        const aggregatedData: { [key: string]: { total: number; completed: number } } = {};
        let completed_n = 0;
        rows.forEach((row) => {
            const syozoku = row[4];
            const status = row[7];
            if (!aggregatedData[syozoku]) {
                aggregatedData[syozoku] = { total: 0, completed: 0 };
            }
            aggregatedData[syozoku].total++;
            if (status === '受講済み') {
                aggregatedData[syozoku].completed++;
                completed_n++;
            }
        });

        const chartData = Object.keys(aggregatedData).map((syozoku) => ({
            syozoku,
            jukouritsu:
                aggregatedData[syozoku].total > 0
                    ? Math.round((aggregatedData[syozoku].completed / aggregatedData[syozoku].total) * 10000)/100
                    : 0,
            mijukouritu: Math.round(
                (1 - aggregatedData[syozoku].completed / aggregatedData[syozoku].total) * 10000
            )/100,
        }));
        chartData.sort((a, b) => a.jukouritsu - b.jukouritsu);

        const jukoutotal = Math.round(10000*completed_n/rows.length)/100;
        const mijukoutotal = Math.round(10000*(rows.length -completed_n)/rows.length)/100;
        const pieChartData = [
            { id: 0, value: jukoutotal, label: '受講済み',color:'lightblue' },
            { id: 1, value: mijukoutotal, label: '未受講',color:'orange' },
        ];

        updatePieChart(pieChartData);
        updateChart(chartData);
    };

    return (
        <GridToolbarContainer>
            <Button
                color="primary"
                size="small"
                startIcon={<ExportIcon />}
                onClick={() => handleExportWithUtf8Bom({ getRowsToExport: getFilteredRows })}
            >
                Filtered rows
            </Button>
            <Button color="primary" size="small" onClick={updateChartData}>
                Update Chart
            </Button>
        </GridToolbarContainer>
    );
}

const chartSetting = {
    yAxis: [
        {
            label: '受講率 (%)',
        },
    ],
    width: '100%',
    height: 300,
};

export default function AnalysisPage() {
    const [allResults, setAllResultData] = useState<any[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [chartDataset, setChartDataset] = useState<any[]>([]);
    const [files, setFiles] = useState({ seminar: null });
    const [loading, setLoading] = useState(false);
    const [pieChartData, setPieChartData] = useState<any[]>([]);
    const [filter, setFilter] = useState<string>('柏');
    const [filter2, setFilter2] = useState<string>('休業');
    const [filter3, setFilter3] = useState<string>('all');
    const handleFileChange = (type: 'seminar', file: File) => {
        setFiles((prev) => ({ ...prev, [type]: file }));
    };
    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(event.target.value); // フィルター条件を更新
    };
    const handleFilterChange2 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter2(event.target.value); // フィルター条件を更新
    };
    const handleFilterChange3 = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter3(event.target.value); // フィルター条件を更新
    };
    const handleAnalysis = async () => {
        if (!files.seminar) {
            alert('ファイルをアップロードしてください');
            return;
        }

        setLoading(true); // ローディング状態に設定

        try {
            // Excelファイルを非同期で解析
            const seminarData = await new Promise<any>((resolve) => {
                setTimeout(async () => {
                    const data = await parseExcel(files.seminar);
                    resolve(data);
                }, 0); // イベントループをブロックしない
            });

            // データの集計を非同期で実行
            const allResults = await new Promise<any[]>((resolve) => {
                setTimeout(() => {
                    const results = reconcileData(seminarData);
                    resolve(results);
                }, 0);
            });

            setAllResultData(allResults); // 全データを保存
            setFilteredResults(allResults.filter((item) => item.tiku === filter)); // 初期フィルターを適用
        } catch (error) {
            console.error('解析エラー:', error);
        } finally {
            setLoading(false); // ローディング終了
        }
    };
    const filterData = () => {
        if (filter === 'all' && filter2 === 'all' && filter3 === 'all') {
            setFilteredResults(allResults); // フィルターなしの場合は全データ
        } else {
            
            let filtered = [];
            filtered = allResults.filter((item) => 
                (filter !== 'all'? item.tiku === filter:true) && 
                (filter2 !== 'all'? item.state !== filter2:true) &&
                (filter3 !== 'all'? (filter3 === '常勤非常勤' ? (item.kind === '常勤' || item.kind === '非常勤'):(item.kind !== '常勤' && item.kind !== '非常勤')) : (true) )
            );
            setFilteredResults(filtered); // フィルターされたデータを設定
        }
    };
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'nayose', headerName: '名寄せ結果', width: 100 },
        { field: 'name', headerName: '名前', width: 200 },
        { field: 'tiku', headerName: '地区', width: 80 },
        { field: 'syozoku', headerName: '所属', width: 300 },
        { field: 'syokusyu', headerName: '職種', width: 300 },
        { field: 'state', headerName: 'State', width: 100 },
        { field: 'status', headerName: '受講ステータス', width: 200 },
        { field: 'mail', headerName: 'メール', width: 200 },
        { field: 'kind', headerName: '分類', width: 200 },
    ];

    const formatDataForGrid = (data: any[]) =>
        data.map((item, index) => ({ id: index + 1, ...item }));
    React.useEffect(() => {
        filterData();
    }, [filter,filter2,filter3]);
    return (
        <React.Fragment>
            <Head>
                <title>研修集計ページ</title>
            </Head>
            <Root>
                <Box sx={{ width: '80%', display: 'inline-block' }}>
                    <Typography gutterBottom sx={{ float: 'left' }}>
                        <Link href="/home">↩Topに戻る</Link>
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                        研修集計ページ
                    </Typography>
                    {TempDownloadButton()}
                    <Card sx={{ maxWidth: 600, margin: '0 auto', mt: 4 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                ファイルをアップロード
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <label>File: </label>
                                <input
                                        type="file"
                                        name="file"
                                        onChange={(e) =>
                                            handleFileChange('seminar', e.target.files[0])
                                        }
                                    />
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleAnalysis}
                                fullWidth
                                disabled={loading}
                            >
                                {loading ? '処理中...' : '解析開始'}
                            </Button>
                        </CardActions>
                    </Card>

                    {loading && (
                        <Box sx={{ width: '100%', paddingTop: '3rem' }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {!loading && (
                        <>
                            <Box sx={{ width: '100%', paddingTop: '2rem' }}>

                                <FormControl component="fieldset" sx={{ marginBottom: '1rem' }}>
                                    <Typography variant="h5" gutterBottom>
                                        フィルター条件
                                    </Typography>
                                    <RadioGroup
                                        row
                                        aria-label="filter"
                                        name="filter"
                                        value={filter}
                                        onChange={handleFilterChange}
                                        
                                    >
                                        <FormControlLabel value="all" control={<Radio />} label="ALL" />
                                        <FormControlLabel value="柏" control={<Radio />} label="柏"/>
                                        <FormControlLabel value="築地" control={<Radio />} label="築地" />
                                    </RadioGroup>
                                    <RadioGroup
                                        row
                                        aria-label="filter"
                                        name="filter"
                                        value={filter3}
                                        onChange={handleFilterChange3}
                                    >
                                        <FormControlLabel value="all" control={<Radio />} label="ALL" />
                                        <FormControlLabel value="常勤非常勤" control={<Radio />} label="常勤/非常勤"/>
                                        <FormControlLabel value="その他" control={<Radio />} label="その他" />
                                    </RadioGroup>
                                    <RadioGroup
                                        row
                                        aria-label="filter"
                                        name="filter2"
                                        value={filter2}
                                        onChange={handleFilterChange2}
                                    >
                                        <FormControlLabel value="all" control={<Radio />} label="ALL" />
                                        <FormControlLabel value="休業" control={<Radio />} label="休業は除く"/>
                                    </RadioGroup>
                                </FormControl>
                                <Typography variant="h5" gutterBottom>
                                    集計データ
                                </Typography>
                                <Box mt={6} sx={{ maxHeight: 600, overflow: 'auto', margin: 0 }}>
                                    <DataGrid
                                        rows={formatDataForGrid(filteredResults)}
                                        columns={columns}
                                        sx={{ backgroundColor: 'white', height: 600 }}
                                        slots={{
                                                toolbar: () => (
                                                    <CustomToolbar
                                                        updateChart={(data) => setChartDataset(data)}
                                                        updatePieChart={(data) => setPieChartData(data)}
                                                    />
                                                ),
                                            }}
                                    />
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    textAlign: 'center',
                                    marginTop: '2rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <PieChart
                                    series={[
                                        {
                                            data: pieChartData,
                                            arcLabel: (item) => `${item.value}%`,
                                            
                                        },
                                        
                                    ]}
                                    
                                    slotProps={{
                                        
                                        legend: {
                                            direction: 'column',
                                            position: { vertical: 'top', horizontal: 'right' },
                                            padding: 0,    
                                        }
                                    }}
                                    width={350}
                                    height={300}
                                />
                                <BarChart
                                    height={1200}
                                    margin={{ top: 50, right: 30, bottom: 1000, left: 40 }} 
                                    dataset={chartDataset}
                                    xAxis={[
                                        {
                                            tickLabelStyle: { 
                                                angle: 90,
                                                textAnchor: 'start',
                                            },
                                            scaleType: 'band',
                                            dataKey: 'syozoku',
                                            label: null
                                        },
                                        
                                    ]}
                                    series={[
                                        {
                                            dataKey: 'jukouritsu',
                                            label: '受講率 (%)',
                                            color: '#62a2ba',
                                            stack: 'syozoku',
                                        },
                                        {
                                            dataKey: 'mijukouritu',
                                            label: '未受講率 (%)',
                                            color: '#e4bbb2',
                                            stack: 'syozoku',
                                        },
                                    ]}
                                    
                                    
                                />
                            </Box>
                        </>
                    )}
                </Box>
            </Root>
        </React.Fragment>
    );
}

