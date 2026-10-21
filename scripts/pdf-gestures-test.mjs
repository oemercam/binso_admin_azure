import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const {boundPdfZoom,pdfSwipePage}=await import(moduleUrl(await fs.readFile('lib/pdf-gestures.ts','utf8')));
assert.equal(boundPdfZoom(.1),1);assert.equal(boundPdfZoom(20),4);assert.equal(boundPdfZoom(NaN),1);assert.equal(boundPdfZoom(1.6),1.6);
assert.equal(pdfSwipePage(2,5,-80,0,1,false),3);assert.equal(pdfSwipePage(2,5,80,0,1,false),1);
assert.equal(pdfSwipePage(1,5,80,0,1,false),1);assert.equal(pdfSwipePage(5,5,-80,0,1,false),5);
for(const [dx,dy,zoom,multi]of [[20,0,1,false],[-100,120,1,false],[-100,0,2,false],[-100,0,1,true]])assert.equal(pdfSwipePage(2,5,dx,dy,zoom,multi),2,'Vertical scrolling, small taps, zoomed panning and pinches cannot turn a page');
console.log('PDF gestures: bounded pinch zoom, fit-page swipes, edge bounds, pan/multitouch/vertical rejection passed.');
