const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/index.html');
  
  await page.waitForSelector('.welcome-card');
  const cards = await page.$$('.welcome-card');
  await cards[0].click(); // First one is New Blank Document
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.keyboard.type('Hello World');
  
  const pStyle = await page.$eval('#editor p', el => {
     const computed = window.getComputedStyle(el);
     return {
        textAlign: computed.textAlign,
        display: computed.display,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        width: computed.width
     };
  });
  console.log("COMPUTED STYLE OF P:", pStyle);

  const edStyle = await page.$eval('#editor', el => {
     const computed = window.getComputedStyle(el);
     return {
        textAlign: computed.textAlign,
        display: computed.display,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems
     };
  });
  console.log("COMPUTED STYLE OF EDITOR:", edStyle);

  await browser.close();
})();
