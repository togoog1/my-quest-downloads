import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const app=await electron.launch({executablePath:process.env.APP_EXE,args:process.platform==='linux'?['--no-sandbox']:[],timeout:60000,env:{...process.env,QUEST_DATA_DIR:mkdtempSync(join(tmpdir(),'quest-release-smoke-'))}});
try {
 const page=await app.firstWindow();await page.setViewportSize({width:1400,height:950});
 const button=page.getByRole('button',{name:/App updates · v/});await button.waitFor();
 assert.equal(await page.getByText('Every great story').count(),0);
 const info=await page.evaluate(()=>window.quest.boot());assert.equal(info.build.version,process.env.RELEASE_TAG.replace(/^v/,''));assert.equal(info.build.development,false);
 await button.click();await page.getByRole('dialog',{name:'App updates',exact:true}).waitFor();
 const state=await page.evaluate(()=>window.quest.updates.state());assert.equal(state.status,'idle');
 if(process.env.VERIFY_UPDATE_FEED==='true') {
  const checked=await page.evaluate(()=>window.quest.updates.check());assert.equal(checked.status,process.env.EXPECTED_UPDATE?'available':'current',JSON.stringify(checked));
  if(process.env.EXPECTED_UPDATE)assert.equal(checked.version,process.env.EXPECTED_UPDATE);
  console.log('Feed result:',JSON.stringify(checked));
 }
 await page.screenshot({path:'release-smoke.png'});
 console.log(JSON.stringify({platform:process.platform,architecture:process.arch,build:info.build,state}));
} finally {await app.close();}
