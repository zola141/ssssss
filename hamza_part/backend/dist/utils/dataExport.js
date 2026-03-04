"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseImportFile = exports.saveExportToFile = exports.exportToXML = exports.exportToCSV = exports.exportToJSON = void 0;
const json2csv_1 = require("json2csv");
const xml2js_1 = require("xml2js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const exportToJSON = (data) => {
    return JSON.stringify(data, null, 2);
};
exports.exportToJSON = exportToJSON;
const exportToCSV = (data, dataType) => {
    const dataArray = data[dataType] || [];
    if (dataArray.length === 0) {
        return 'No data to export';
    }
    try {
        const parser = new json2csv_1.Parser();
        return parser.parse(dataArray);
    }
    catch (error) {
        console.error('Error converting to CSV:', error);
        throw error;
    }
};
exports.exportToCSV = exportToCSV;
const exportToXML = (data) => {
    const builder = new xml2js_1.Builder();
    const xmlData = {
        export: {
            timestamp: new Date().toISOString(),
            data: data,
        },
    };
    return builder.buildObject(xmlData);
};
exports.exportToXML = exportToXML;
const saveExportToFile = (content, format, fileName) => {
    const extension = format === 'csv' ? 'csv' : format === 'xml' ? 'xml' : 'json';
    const filePath = path.join(process.cwd(), 'exports', `${fileName}-${Date.now()}.${extension}`);
    // Create exports directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
};
exports.saveExportToFile = saveExportToFile;
// ---- IMPORT HELPERS ----
// Known numeric fields in our data model
const NUMERIC_FIELDS = new Set([
    'score1', 'score2', 'score3', 'score4',
    'duration', 'player_count',
    'total_wins', 'total_losses', 'level', 'xp',
]);
// Known nullable string fields (UUIDs that can be null)
const NULLABLE_STRING_FIELDS = new Set([
    'player3_id', 'player4_id', 'winner_id',
]);
/**
 * Smart value converter for imported data.
 * Converts values based on the field name to ensure correct types.
 */
const convertValue = (header, rawVal) => {
    const val = rawVal.trim();
    // Empty / null / undefined → null
    if (val === '' || val === 'null' || val === 'undefined') {
        return null;
    }
    // Known numeric fields → convert to number
    if (NUMERIC_FIELDS.has(header)) {
        const num = Number(val);
        return isNaN(num) ? null : num;
    }
    // Everything else stays as string (UUIDs, timestamps, actions, etc.)
    return val;
};
/**
 * Parse a CSV line properly, handling quoted fields that may contain commas.
 */
const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Escaped quote inside quoted field
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }
    result.push(current);
    return result;
};
/**
 * Flatten xml2js parsed output into our expected schema format.
 * xml2js wraps everything in arrays and nested objects.
 */
const flattenXMLData = (xmlParsed) => {
    try {
        const root = xmlParsed?.export?.data?.[0] || xmlParsed?.export?.data || xmlParsed;
        const result = {};
        // Helper to flatten an xml2js array of items
        const flattenArray = (items) => {
            return items.map((item) => {
                const flat = {};
                for (const key of Object.keys(item)) {
                    // xml2js wraps values in arrays, unwrap them
                    const val = Array.isArray(item[key]) ? item[key][0] : item[key];
                    flat[key] = val === '' || val === undefined ? null : val;
                }
                return flat;
            });
        };
        // Try to extract each data section
        if (root.matches) {
            const matchesRaw = Array.isArray(root.matches) ? root.matches[0] : root.matches;
            if (matchesRaw && matchesRaw.match) {
                result.matches = flattenArray(Array.isArray(matchesRaw.match) ? matchesRaw.match : [matchesRaw.match]);
            }
            else if (Array.isArray(matchesRaw)) {
                result.matches = flattenArray(matchesRaw);
            }
        }
        if (root.userStats) {
            const statsRaw = Array.isArray(root.userStats) ? root.userStats[0] : root.userStats;
            if (statsRaw && statsRaw.stat) {
                result.userStats = flattenArray(Array.isArray(statsRaw.stat) ? statsRaw.stat : [statsRaw.stat]);
            }
            else if (Array.isArray(statsRaw)) {
                result.userStats = flattenArray(statsRaw);
            }
        }
        if (root.userActivity) {
            const activityRaw = Array.isArray(root.userActivity) ? root.userActivity[0] : root.userActivity;
            if (activityRaw && activityRaw.activity) {
                result.userActivity = flattenArray(Array.isArray(activityRaw.activity) ? activityRaw.activity : [activityRaw.activity]);
            }
            else if (Array.isArray(activityRaw)) {
                result.userActivity = flattenArray(activityRaw);
            }
        }
        // Convert numeric fields in the flattened data
        if (result.matches) {
            result.matches = result.matches.map((m) => {
                for (const field of NUMERIC_FIELDS) {
                    if (m[field] !== null && m[field] !== undefined) {
                        const num = Number(m[field]);
                        m[field] = isNaN(num) ? null : num;
                    }
                }
                return m;
            });
        }
        if (result.userStats) {
            result.userStats = result.userStats.map((s) => {
                for (const field of NUMERIC_FIELDS) {
                    if (s[field] !== null && s[field] !== undefined) {
                        const num = Number(s[field]);
                        s[field] = isNaN(num) ? null : num;
                    }
                }
                return s;
            });
        }
        return result;
    }
    catch (e) {
        console.error('Error flattening XML data:', e);
        return xmlParsed;
    }
};
const parseImportFile = async (filePath, format) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (format === 'json') {
        return JSON.parse(content);
    }
    else if (format === 'csv') {
        // Parse CSV with proper handling of quotes, commas, empty fields, and types
        const lines = content.split(/\r?\n/);
        const headers = parseCSVLine(lines[0]).map((h) => h.trim());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '')
                continue;
            const values = parseCSVLine(lines[i]);
            const obj = {};
            headers.forEach((header, index) => {
                const rawVal = values[index] !== undefined ? values[index] : '';
                obj[header] = convertValue(header, rawVal);
            });
            result.push(obj);
        }
        // Wrap in expected schema structure
        return { matches: result };
    }
    else if (format === 'xml') {
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser({ explicitArray: false });
        const xmlParsed = await parser.parseStringPromise(content);
        return flattenXMLData(xmlParsed);
    }
    throw new Error('Unsupported file format');
};
exports.parseImportFile = parseImportFile;
//# sourceMappingURL=dataExport.js.map