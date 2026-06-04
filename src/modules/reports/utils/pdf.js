import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer";

handlebars.registerHelper("inc", (v) => Number(v) + 1);
handlebars.registerHelper("json", (v) => JSON.stringify(v, null, 2));
handlebars.registerHelper("formatDate", (date) => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return String(date);
  }
});

export const generateReportPdf = async ({ title, type, date_from, date_to, data }) => {
  const templatePath = path.join(process.cwd(), "src/modules/reports/pdf/template_report.hbs");
  const html = fs.readFileSync(templatePath, "utf-8");
  const template = handlebars.compile(html);

  const rows = (() => {
    if (type === "users") return data?.users || [];
    if (type === "appointments") return data?.appointments || [];
    if (type === "consultations") return data?.consultations || [];
    if (type === "medical-records") return data?.medical_records || [];
    return [];
  })();

  const columns = rows.length ? Object.keys(rows[0]) : [];

  const finalHtml = template({
    title,
    generated_at: new Date().toISOString(),
    date_from,
    date_to,
    summary: data?.summary || null,
    columns,
    rows,
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(finalHtml, { waitUntil: "domcontentloaded" });

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
};

