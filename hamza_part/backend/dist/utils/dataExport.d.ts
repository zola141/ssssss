export interface ExportData {
    matches?: any[];
    userStats?: any[];
    userActivity?: any[];
    userProfile?: any;
}
export declare const exportToJSON: (data: ExportData) => string;
export declare const exportToCSV: (data: ExportData, dataType: "matches" | "userStats" | "userActivity") => string;
export declare const exportToXML: (data: ExportData) => string;
export declare const saveExportToFile: (content: string, format: "json" | "csv" | "xml", fileName: string) => string;
export declare const parseImportFile: (filePath: string, format: "json" | "csv" | "xml") => Promise<any>;
//# sourceMappingURL=dataExport.d.ts.map