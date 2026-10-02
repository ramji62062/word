const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/index.html');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click below the banner
  await page.click('#editor p');
  
  await page.keyboard.type('Hello World');
  
  const pStyle = await page.$eval('#editor > p', el => {
     const computed = window.getComputedStyle(el);
     return {
        textAlign: computed.textAlign,
        display: computed.display
     };
  });
  console.log("WELCOME PAGE P STYLE:", pStyle);

  await browser.close();
})();
