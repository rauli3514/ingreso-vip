// Planillas de invitados del organizador: leer Excel (.xlsx) o CSV y generar
// Excel, sin librerías. Las columnas son las mismas que lee el Kiosco Box de
// EventPix (Mesa, Nombre, Apellido, Trasnoche, Living), así el Excel que baja
// el organizador se carga directo en el kiosco.

import type { PlannerGuest, PlannerTable } from '../pages/public/event_planner/types';

export const GUEST_COLUMNS = ['Mesa', 'Nombre', 'Apellido', 'Grupo', 'Confirmado', 'Trasnoche', 'Living', 'Nota'];

// ─── Lectura ─────────────────────────────────────────────────────────────

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

interface ZipEntry { name: string; method: number; size: number; offset: number }

function zipEntries(buf: Uint8Array): ZipEntry[] {
    let end = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
        if (u32(buf, i) === 0x06054b50) { end = i; break; }
    }
    if (end < 0) throw new Error('El archivo no es un Excel válido');
    const count = u16(buf, end + 10);
    let p = u32(buf, end + 16);
    const entries: ZipEntry[] = [];
    const decoder = new TextDecoder();
    for (let i = 0; i < count; i++) {
        if (u32(buf, p) !== 0x02014b50) break;
        const nameLen = u16(buf, p + 28), extraLen = u16(buf, p + 30), commentLen = u16(buf, p + 32);
        entries.push({
            name: decoder.decode(buf.subarray(p + 46, p + 46 + nameLen)),
            method: u16(buf, p + 10),
            size: u32(buf, p + 20),
            offset: u32(buf, p + 42),
        });
        p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
}

async function readEntry(buf: Uint8Array, e: ZipEntry): Promise<string> {
    const nameLen = u16(buf, e.offset + 26), extraLen = u16(buf, e.offset + 28);
    const start = e.offset + 30 + nameLen + extraLen;
    const data = buf.subarray(start, start + e.size);
    if (e.method === 0) return new TextDecoder().decode(data);
    if (e.method !== 8) throw new Error('Formato de Excel no soportado');
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede leer Excel: guardalo como CSV');
    const stream = new Blob([data.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
}

const colIndex = (ref: string) => {
    let n = 0;
    for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
};

async function readXlsx(file: Blob): Promise<string[][]> {
    const buf = new Uint8Array(await file.arrayBuffer());
    const entries = zipEntries(buf);
    const find = (name: string) => entries.find(e => e.name === name);
    const parser = new DOMParser();

    const shared: string[] = [];
    const sst = find('xl/sharedStrings.xml');
    if (sst) {
        const doc = parser.parseFromString(await readEntry(buf, sst), 'application/xml');
        for (const si of Array.from(doc.getElementsByTagName('si'))) {
            shared.push(Array.from(si.getElementsByTagName('t')).map(t => t.textContent ?? '').join(''));
        }
    }

    const sheet = find('xl/worksheets/sheet1.xml') ?? entries.find(e => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name));
    if (!sheet) throw new Error('El Excel no tiene hojas');
    const doc = parser.parseFromString(await readEntry(buf, sheet), 'application/xml');
    const rows: string[][] = [];
    for (const row of Array.from(doc.getElementsByTagName('row'))) {
        const cells: string[] = [];
        for (const c of Array.from(row.getElementsByTagName('c'))) {
            const ref = c.getAttribute('r');
            const index = ref ? colIndex(ref) : cells.length;
            const type = c.getAttribute('t');
            let value: string;
            if (type === 'inlineStr') value = Array.from(c.getElementsByTagName('t')).map(t => t.textContent ?? '').join('');
            else {
                const v = c.getElementsByTagName('v')[0]?.textContent ?? '';
                value = type === 's' ? shared[Number(v)] ?? '' : v;
            }
            while (cells.length < index) cells.push('');
            cells[index] = value.trim();
        }
        rows.push(cells);
    }
    return rows;
}

/** CSV de Excel (separado por coma o punto y coma, con comillas). */
function parseCsv(text: string): string[][] {
    const clean = text.replace(/^﻿/, '');
    const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
    const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [], cell = '', quoted = false;
    for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (quoted) {
            if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === sep) { row.push(cell.trim()); cell = ''; }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && clean[i + 1] === '\n') i++;
            row.push(cell.trim()); rows.push(row); row = []; cell = '';
        } else cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
}

const normalize = (s: string) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const isYes = (s: string | undefined) => /^(si|s|x|yes|y|1|true|verdadero|confirmado)$/i.test(normalize(s ?? ''));

/** Encabezados aceptados para cada dato (en minúscula y sin acentos). */
const HEADERS = {
    first: ['nombre', 'nombres', 'first_name', 'name'],
    last: ['apellido', 'apellidos', 'last_name', 'surname'],
    table: ['mesa', 'mesas', 'nro de mesa', 'nro mesa', 'numero de mesa', 'n° mesa', 'nº mesa', 'table', 'ubicacion', 'lugar'],
    group: ['grupo', 'group', 'familia'],
    confirmed: ['confirmado', 'confirmada', 'estado', 'status', 'asiste'],
    afterParty: ['trasnoche', 'after', 'after_party'],
    living: ['living', 'puff', 'sillon'],
    note: ['nota', 'notas', 'observaciones', 'observacion', 'comentario'],
};

const newId = () => Math.random().toString(36).slice(2, 11);

/**
 * Lee un Excel (.xlsx) o CSV de invitados. Las mesas que no existen se crean
 * ("1" pasa a "Mesa 1"). Devuelve los invitados nuevos y la lista de mesas.
 */
export async function importGuestFile(
    file: File,
    existingTables: PlannerTable[],
    tableCapacity: number
): Promise<{ guests: PlannerGuest[]; tables: PlannerTable[] }> {
    const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
    const rows = isCsv ? parseCsv(await file.text()) : await readXlsx(file);

    const headerIndex = rows.findIndex(r => r.some(c => HEADERS.first.includes(normalize(c))));
    if (headerIndex < 0) throw new Error('No encontramos la columna "Nombre". Usá la plantilla.');
    const header = rows[headerIndex].map(normalize);
    const col = (names: string[]) => header.findIndex(h => names.includes(h));
    const idx = {
        first: col(HEADERS.first), last: col(HEADERS.last), table: col(HEADERS.table),
        group: col(HEADERS.group), confirmed: col(HEADERS.confirmed),
        afterParty: col(HEADERS.afterParty), living: col(HEADERS.living), note: col(HEADERS.note),
    };
    const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');

    const tables = [...existingTables];
    const guests: PlannerGuest[] = [];
    for (const r of rows.slice(headerIndex + 1)) {
        let first = cell(r, idx.first);
        let last = cell(r, idx.last);
        if (!first && !last) continue;
        // Si el nombre completo vino en una sola columna, se separa el apellido
        if (!last && idx.last < 0 && first.includes(' ')) {
            const parts = first.split(/\s+/);
            last = parts.pop() ?? '';
            first = parts.join(' ');
        }

        let tableId: string | undefined;
        let label = cell(r, idx.table);
        if (label) {
            if (/^\d+$/.test(label)) label = `Mesa ${label}`;
            let table = tables.find(t => t.label.toLowerCase() === label.toLowerCase());
            if (!table) {
                table = { id: newId(), type: 'round', x: 0, y: 0, rotation: 0, label, capacity: tableCapacity };
                tables.push(table);
            }
            tableId = table.id;
        }

        guests.push({
            id: newId(),
            first_name: first,
            last_name: last,
            display_name: `${first} ${last}`.trim() || 'Invitado',
            status: isYes(cell(r, idx.confirmed)) ? 'confirmed' : 'pending',
            group: cell(r, idx.group),
            table_id: tableId,
            table_info: label || undefined,
            is_after_party: isYes(cell(r, idx.afterParty)),
            has_puff: isYes(cell(r, idx.living)),
            note: cell(r, idx.note),
        });
    }
    if (!guests.length) throw new Error('El archivo no tiene invitados');
    return { guests, tables };
}

// ─── Escritura (.xlsx mínimo: ZIP sin comprimir + texto en cada celda) ────

const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
    }
    return t;
})();

const crc32 = (data: Uint8Array) => {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
};

function zipStored(files: { name: string; content: string }[]): Blob {
    const enc = new TextEncoder();
    const parts: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    for (const f of files) {
        const name = enc.encode(f.name);
        const data = enc.encode(f.content);
        const crc = crc32(data);

        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);         // versión
        lv.setUint16(6, 0x0800, true);     // nombres en UTF-8
        lv.setUint16(8, 0, true);          // sin comprimir
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        local.set(name, 30);
        parts.push(local, data);

        const dir = new Uint8Array(46 + name.length);
        const dv = new DataView(dir.buffer);
        dv.setUint32(0, 0x02014b50, true);
        dv.setUint16(4, 20, true);
        dv.setUint16(6, 20, true);
        dv.setUint16(8, 0x0800, true);
        dv.setUint16(10, 0, true);
        dv.setUint32(16, crc, true);
        dv.setUint32(20, data.length, true);
        dv.setUint32(24, data.length, true);
        dv.setUint16(28, name.length, true);
        dv.setUint32(42, offset, true);
        dir.set(name, 46);
        central.push(dir);

        offset += local.length + data.length;
    }

    const centralSize = central.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    return new Blob([...parts, ...central, end] as BlobPart[], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
}

const xmlEscape = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // caracteres de control que XML no admite
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const colName = (i: number) => {
    let s = '';
    for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
};

/** Genera un .xlsx con una hoja: la primera fila va en negrita. */
export function buildXlsx(rows: string[][], sheetName = 'Invitados'): Blob {
    const widths = rows[0].map((_, c) => Math.min(40, Math.max(8, ...rows.map(r => (r[c] ?? '').length + 2))));
    const sheetRows = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) =>
        `<c r="${colName(ci)}${ri + 1}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEscape(v ?? '')}</t></is></c>`
    ).join('')}</row>`).join('');

    const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    return zipStored([
        {
            name: '[Content_Types].xml',
            content: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
        },
        {
            name: '_rels/.rels',
            content: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        },
        {
            name: 'xl/workbook.xml',
            content: `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        },
        {
            name: 'xl/_rels/workbook.xml.rels',
            content: `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
        },
        {
            name: 'xl/styles.xml',
            content: `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
        },
        {
            name: 'xl/worksheets/sheet1.xml',
            content: `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows}</sheetData></worksheet>`,
        },
    ]);
}

const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const safeFileName = (s: string) => (s || 'evento').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '_');

/** Lista de invitados en Excel (sirve para el Kiosco Box: Mesa, Nombre, Apellido, Trasnoche, Living). */
export function exportGuestsXlsx(eventName: string, guests: PlannerGuest[], tables: PlannerTable[]) {
    const tableLabel = (g: PlannerGuest) => tables.find(t => t.id === g.table_id)?.label || '';
    // Por mesa (Mesa 1, Mesa 2, … Mesa 10) y los que no tienen mesa al final.
    const sorted = [...guests].sort((a, b) => {
        const ta = tableLabel(a), tb = tableLabel(b);
        if (!ta !== !tb) return ta ? -1 : 1;
        return ta.localeCompare(tb, 'es', { numeric: true }) || a.display_name.localeCompare(b.display_name, 'es');
    });
    const rows = [
        GUEST_COLUMNS,
        ...sorted.map(g => [
            tableLabel(g),
            g.first_name || '',
            g.last_name || '',
            g.group || '',
            g.status === 'confirmed' ? 'Sí' : 'No',
            g.is_after_party ? 'Sí' : '',
            g.has_puff ? 'Sí' : '',
            g.note || '',
        ]),
    ];
    downloadBlob(buildXlsx(rows), `Invitados_${safeFileName(eventName)}.xlsx`);
}

/** Plantilla vacía con ejemplos, con las mismas columnas que la exportación. */
export function downloadGuestTemplate() {
    const rows = [
        GUEST_COLUMNS,
        ['1', 'Juan', 'Pérez', 'Familia Novio', 'Sí', '', '', 'Vegetariano'],
        ['1', 'Ana', 'Gómez', 'Familia Novio', 'No', '', 'Sí', ''],
        ['2', 'Luis', 'García', 'Amigos', 'Sí', 'Sí', '', ''],
    ];
    downloadBlob(buildXlsx(rows), 'plantilla_invitados.xlsx');
}

export const GUEST_FILE_ACCEPT = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
