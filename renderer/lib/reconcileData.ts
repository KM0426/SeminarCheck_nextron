import { normalizeName } from './nameMapping';

export function reconcileData(
    AllData: {}, 
) {
    const Results: any[] = [];
    const employees: any[] = AllData['employee'];
    const contractors: any[] = AllData['contractor'];
    const seminers: any[] = AllData['seminer'];
    const depsTotal = [];

    // 職員名簿データの処理
    employees.forEach((employee) => {
        const normalizedEmployeeName = normalizeName(employee.name);
        const seminarRecord = seminers.find(
            (record) => normalizeName(record.name) === normalizedEmployeeName
        );
        let is_jukou = false;
        if(!(employee.syozoku in depsTotal)){
            depsTotal[employee.syozoku]= {syozoku:employee.syozoku,jukouzumi:0,mijukou:0};
        }
        if(seminarRecord && seminarRecord.jukouno){
            is_jukou = true;
            depsTotal[employee.syozoku].jukouzumi += 1;
        }else{
            depsTotal[employee.syozoku].mijukou +=  1;
        }

        Results.push({
            name: employee.name,
            status: is_jukou ? "受講済み" : "未受講",
            nayose:seminarRecord ? "◯":"",
            tiku:employee.tiku == undefined  || employee.sisetu == ''? "不明" : employee.tiku,
            syozoku:employee.syozoku,
            syokusyu:employee.syokusyu,
            state:employee.state,
            mail:seminarRecord && seminarRecord.mail ? seminarRecord.mail: "",
            kind:employee.kubun,
        });

    });

    // 派遣委託リストデータの処理
    contractors.forEach((contractor) => {
        const normalizedContractorName = normalizeName(contractor.name);
        const seminarRecord = seminers.find(
            (record) => normalizeName(record.name) === normalizedContractorName
        );
        let is_jukou = false;
        if(!(contractor.syozoku in depsTotal)){
            depsTotal[contractor.syozoku]= {syozoku:contractor.syozoku,jukouzumi:0,mijukou:0};
        }
        if(seminarRecord && seminarRecord.jukouno){
            is_jukou = true;
            depsTotal[contractor.syozoku].jukouzumi += 1;
        }else{
            depsTotal[contractor.syozoku].mijukou +=  1;
        }
        Results.push({
            name: contractor.name,
            status: is_jukou ? "受講済み" : "未受講",
            nayose:seminarRecord ? "◯":"",
            tiku:"柏",
            syozoku:contractor.syozoku,
            syokusyu:contractor.gyousyu,
            state:"",
            mail:seminarRecord && seminarRecord.mail ? seminarRecord.mail: "",
            kind:contractor.kubun
            ,
        });
    });

    // Seminarファイルにあって職員リストにない
    seminers.forEach((seminer)=>{
        if(seminer.jukouno){
            const normalizedSeminerName = normalizeName(seminer.name);
            const employeeRecord = employees.find(
                (record) => normalizeName(record.name) === normalizedSeminerName
            );
            if (!employeeRecord) {
                const contractorRecord = contractors.find(
                    (record) => normalizeName(record.name) === normalizedSeminerName
                );
                if (!contractorRecord) {
                    if(!(seminer.shisetu+seminer.busyo in depsTotal)){
                        depsTotal[seminer.shisetu+seminer.busyo]= {syozoku:seminer.shisetu+seminer.busyo,jukouzumi:0,mijukou:0};
                    }
                    depsTotal[seminer.shisetu+seminer.busyo].jukouzumi += 1;
                    Results.push({
                        name: seminer.name,
                        status: seminer.jukouno ? "受講済み" : "未受講",
                        nayose:"",
                        tiku:seminer.sisetu == undefined || seminer.sisetu == ''? "不明" : seminer.tiku,
                        syokusyu:seminer.syokumei,
                        syozoku:seminer.sisetu+seminer.busyo,
                        state:"在籍",
                        mail:seminer.mail,
                        kind:'その他',
                    })
                }
            }
        }
    })

    return Results;
}