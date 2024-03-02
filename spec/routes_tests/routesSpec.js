// Tests for the static + dynamic routing system
const suppressOutput = require('../support/suppressOutput');
const request = require('supertest');
const jasmineCompat = require('../support/jasmineCompat');
const fs = require('node:fs');
const path = require('path');


let server;

describe('routing', () => {
   suppressOutput(() => {}, () => {
      // do this after suppressing output
      server = require('../../server');
   });
   it('should get 404 for undefined route', (done) => {
      request(server)
         .get('/thisisundefined')
         .set('Accept', 'text/plain')
         .expect('Content-type', 'text/plain')
         .expect(404)
         .expect('Resource not found for route /thisisundefined.')
         .end(jasmineCompat(done))
   })
   describe('/test route', () => {
      it('should require GET for /test', (done) => {
         request(server)
            .patch('/test')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method GET required for route /test.')
            .end(jasmineCompat(done))
      })
      it('should allow /test with GET', (done) => {
         request(server)
            .get('/test')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('test response')
            .end(jasmineCompat(done))
      })
   })
   describe('/test route with inputs', () => {
      it('should require post', (done) => {
         request(server)
            .get('/test/123')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method POST required for route /test/123.')
            .end(jasmineCompat(done))
      })
      it('should match with dynamic path\'s regex', (done) => {
         request(server)
            .post('/test/123')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('test response with input: 123')
            .end(jasmineCompat(done))
      })
      it('should only match with digits', (done) => {
         request(server)
            .post('/test/asdf')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(404)
            .expect('Resource not found for route /test/asdf.')
            .end(jasmineCompat(done))
      })
   })
   describe('public file routing', () => {
      it('should provide the html file', (done) => {
         let testhtmlpath = __dirname.split(path.sep)
         testhtmlpath.pop();
         testhtmlpath.pop();
         testhtmlpath.push('public');
         testhtmlpath.push('html');
         testhtmlpath.push('test.html');
         
         let fileContents = fs.readFileSync(path.sep + path.join(...testhtmlpath), 'utf8')
         request(server)
            .get('/html/test.html')
            .set('Accept', 'text/plain')
            .expect(200)
            .expect(fileContents)
            .end(jasmineCompat(done))
      })
      it('should not route directories', (done) => {
         request(server)
            .get('/html')
            .set('Accept', 'text/plain')
            .expect(404)
            .expect('Resource not found for route /html.')
            .end(jasmineCompat(done))
      })
   })
})
