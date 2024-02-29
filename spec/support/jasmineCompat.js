// necessary to get jasmine to work with supertest
const jasmineCompat = (done) => (err, res) => {
    if (err) {
        done.fail(err)
    } else {
        done();
    }
}

module.exports = jasmineCompat
