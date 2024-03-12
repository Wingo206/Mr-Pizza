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
         .trustLocalhost(true)
         .set('Accept', 'text/plain')
         .expect('Content-type', 'text/plain')
         .expect(404)
         .expect('Resource not found for route /thisisundefined.')
         .end(jasmineCompat(done))
   })
   describe('/example route', () => {
      it('should require GET for /example', (done) => {
         request(server)
            .patch('/example')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method GET required for route /example.')
            .end(jasmineCompat(done))
      })
      it('should allow /example with GET', (done) => {
         request(server)
            .get('/example')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('example response')
            .end(jasmineCompat(done))
      })
   })
   describe('/example route with inputs', () => {
      it('should require post', (done) => {
         request(server)
            .get('/example/123')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method POST required for route /example/123.')
            .end(jasmineCompat(done))
      })
      it('should match with dynamic path\'s regex', (done) => {
         request(server)
            .post('/example/123')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('example response with input: 123')
            .end(jasmineCompat(done))
      })
      it('should only match with digits', (done) => {
         request(server)
            .post('/example/asdf')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(404)
            .expect('Resource not found for route /example/asdf.')
            .end(jasmineCompat(done))
      })
   })
   describe('public file routing', () => {
      it('should provide the html file', (done) => {
         let examplehtmlpath = __dirname.split(path.sep)
         examplehtmlpath.pop();
         examplehtmlpath.pop();
         examplehtmlpath.push('public');
         examplehtmlpath.push('html');
         examplehtmlpath.push('example.html');

         let fileContents = fs.readFileSync(path.sep + path.join(...examplehtmlpath), 'utf8')
         request(server)
            .get('/html/example.html')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect(200)
            .expect(fileContents)
            .end(jasmineCompat(done))
      })
      it('should not route directories', (done) => {
         request(server)
            .get('/html')
            .trustLocalhost(true)
            .set('Accept', 'text/plain')
            .expect(404)
            .expect('Resource not found for route /html.')
            .end(jasmineCompat(done))
      })
   })
})
