import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer";

export async function generatePrescriptionPdf(data) {
    const templatePath = path.join(
        process.cwd(),
        "src/modules/prescription/pdf/template.hbs"
    );

    const html = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(html);

    const finalHtml = template(data);

    const browser = await puppeteer.launch({
        headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(finalHtml, {
        waitUntil: "domcontentloaded",
    });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
    });
    
    handlebars.registerHelper("inc", function (value) {
        return parseInt(value) + 1;
    });

    await browser.close();

    return pdf;
}