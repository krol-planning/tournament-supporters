import http.server,threading,os,sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
os.chdir(Path(__file__).resolve().parent.parent)
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),http.server.SimpleHTTPRequestHandler)
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']); c=b.new_context(viewport={'width':1400,'height':900});
 page=c.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'mock.html'); page.click('#start');page.wait_for_function("JSON.parse(localStorage.getItem('sevenMockLatest')||'null')?.progress.total===4");page.click('#progress');page.wait_for_function("JSON.parse(localStorage.getItem('sevenMockLatest')).board.matches.every(m=>m.team1.score===1)");assert page.evaluate("JSON.parse(localStorage.getItem('sevenMockLatest')).progress.finished") == 0
 page.click('#finish');page.wait_for_function("JSON.parse(localStorage.getItem('sevenMockLatest')).progress.done===4",timeout=20000); r=page.evaluate("JSON.parse(localStorage.getItem('sevenMockLatest'))");assert len(r['details'])==4;assert r['details']['001']['battles'][0]['players'][0][0]['weapon']=='モップリン'; print('PASS: four simultaneous finishes, automatic DOM open/parse/close, weapon mapping, no capture at 1-0',flush=True)
 page.click('#correct');page.wait_for_function("JSON.parse(localStorage.getItem('sevenMockLatest')).details['001']?.teams[1].score===2",timeout=15000);print('PASS: corrected result replaced',flush=True)
 control=c.new_page();control.on('pageerror',lambda e:errors.append(str(e)));control.goto(url+'index.html');control.click('#mockPull');assert '詳細取得 4件' in control.locator('#captureStatus').inner_text();control.select_option('#mode','result');control.select_option('#match','001');control.select_option('#battle','1');assert 'モップリン' in control.locator('#stage').inner_text(); assert control.locator('#publish').is_disabled();print('PASS: control import, result display, demo publish blocked',flush=True)
 overlay=c.new_page();overlay.on('pageerror',lambda e:errors.append(str(e)));overlay.goto(url+'overlay.html?mock=1&view=board');assert '模擬大会' in overlay.locator('#stage').inner_text();overlay.screenshot(path='tests/preview.png');assert not errors,errors;b.close()
server.shutdown()
