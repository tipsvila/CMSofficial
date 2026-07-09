const puppeteer = require('D:\\cmsofficial\\node_modules\\puppeteer');
(async()=>{
  const b = await puppeteer.launch({headless:true, defaultViewport:{width:1280,height:800}});
  const pg = await b.newPage();
  await pg.goto('http://localhost:3000/sam-data', {waitUntil:'networkidle0', timeout:15000});
  await new Promise(r=>setTimeout(r, 2000));
  const links = await pg.$$('a[href*="/sam-data/"]');
  console.log('Found links:', links.length);
  if (links.length > 0) {
    const h = await links[0].evaluate(el => el.getAttribute('href'));
    console.log('First link:', h);
    await pg.goto('http://localhost:3000' + h, {waitUntil:'networkidle0', timeout:15000});
    await new Promise(r=>setTimeout(r, 1000));
    await pg.screenshot({path:'D:\\cmsofficial\\screenshot-sam-detail.png'});
    console.log('Detail saved');
    const btns = await pg.$$('button');
    for (const btn of btns) {
      const t = await btn.evaluate(el => el.textContent);
      if (t && t.includes('Email')) {
        await btn.click();
        await new Promise(r=>setTimeout(r, 1500));
        await pg.screenshot({path:'D:\\cmsofficial\\screenshot-sam-email.png'});
        console.log('Email saved');
        break;
      }
    }
    const btns2 = await pg.$$('button');
    for (const btn of btns2) {
      const t = await btn.evaluate(el => el.textContent);
      if (t && t.includes('History')) {
        await btn.click();
        await new Promise(r=>setTimeout(r, 1500));
        await pg.screenshot({path:'D:\\cmsofficial\\screenshot-sam-history.png'});
        console.log('History saved');
        break;
      }
    }
  }
  await b.close();
})();
