import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import puppeteer from "puppeteer";

handlebars.registerHelper("inc", function (value) {
    return parseInt(value) + 1;
});

handlebars.registerHelper("formatDate", function (date) {
    return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
});

export async function generatePDFSK(data) {
    const templatePath = path.join(
        process.cwd(),
        "src/modules/document/pdf/template_SK.hbs"
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

    await browser.close();

    return pdf;
}

export async function generatePDFSR(data) {
    const templatePath = path.join(
        process.cwd(),
        "src/modules/document/pdf/template_SR.hbs"
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

    await browser.close();

    return pdf;
}

export async function generatePDFSS(data) {
    const templatePath = path.join(
        process.cwd(),
        "src/modules/document/pdf/template_SS.hbs"
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

    await browser.close();

    return pdf;
}