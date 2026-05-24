import JSZip from "jszip";

type CellValue = string | number | boolean | null | undefined;

export interface XlsxSheet {
  headers: string[];
  rows: Record<string, CellValue>[];
  hyperlinks?: Record<number, { column: string; target: string; tooltip?: string }>;
  widths?: number[];
}

function xml(value: CellValue) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function cellRef(columnIndex: number, rowIndex: number) {
  return `${columnName(columnIndex)}${rowIndex + 1}`;
}

function cellXml(value: CellValue, ref: string) {
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
}

export async function createXlsxBuffer(sheet: XlsxSheet) {
  const zip = new JSZip();
  const rows = [Object.fromEntries(sheet.headers.map((header) => [header, header])), ...sheet.rows];
  const hyperlinkEntries: string[] = [];
  const relEntries: string[] = [];
  const hyperlinkMap = sheet.hyperlinks ?? {};

  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = sheet.headers
        .map((header, columnIndex) => {
          const ref = cellRef(columnIndex, rowIndex);
          const hyperlink = hyperlinkMap[rowIndex]?.column === header ? hyperlinkMap[rowIndex] : null;
          if (hyperlink) {
            const relId = `rId${relEntries.length + 1}`;
            relEntries.push(
              `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xml(hyperlink.target)}" TargetMode="External"/>`
            );
            hyperlinkEntries.push(
              `<hyperlink ref="${ref}" r:id="${relId}"${hyperlink.tooltip ? ` tooltip="${xml(hyperlink.tooltip)}"` : ""}/>`
            );
          }
          return cellXml(row[header], ref);
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const finalRef = `${cellRef(0, 0)}:${cellRef(sheet.headers.length - 1, rows.length - 1)}`;
  const cols = (sheet.widths ?? []).length
    ? `<cols>${(sheet.widths ?? [])
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join("")}</cols>`
    : "";

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Profiles" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`
  );
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="${finalRef}"/>
  ${cols}
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="${finalRef}"/>
  ${hyperlinkEntries.length ? `<hyperlinks>${hyperlinkEntries.join("")}</hyperlinks>` : ""}
</worksheet>`
  );
  zip.file(
    "xl/worksheets/_rels/sheet1.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relEntries.join("\n")}
</Relationships>`
  );

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
