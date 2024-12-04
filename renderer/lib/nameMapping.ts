export const nameMapping = {
    "邉": "辺", "邊": "辺", "髙": "高", "槗": "橋", "𣘺": "橋",
    "﨑": "崎", "碕": "橋", "嵜": "橋", "斎": "斉", "齊": "斉",
    "齋": "斉", "籐": "藤", "嶌": "島", "桒": "桑", "瀨": "瀬"
};

// 名寄せ変換関数
export function normalizeName(name: string): string {
    if (!name) return name;

    let normalized = name;

    // マッピングに基づいて置き換え
    Object.keys(nameMapping).forEach((key) => {
        normalized = normalized.replaceAll(key, nameMapping[key]);
    });

    // 全角英数字を半角に変換
    normalized = normalized.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    );

    // 大文字を小文字に変換
    normalized = normalized.toLowerCase();

    return normalized.replace(/[\(\（][^\)\）]*[\)\）]/g, "");;
}
