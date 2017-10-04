/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

var test = require('tap').test
var proxyquire = require('proxyquire')
var dnsMock = require('./dns-mock')()
proxyquire('../aResolver', {dns: dnsMock.systemStub})
var concordant = require('../index')
var nodeDns = require('dns')


test('resove with system lookup', function (t) {
  process.env.DNS_MODE = 'A'
  var conc = concordant()
  conc.dns.resolve('service2.testns.svc.cluster.local', function (err, results) {
    t.equal(1, results.length)
    t.equal(null, err)
    t.equal('127.0.0.1', results[0].host)
    t.equal('127.0.0.1', results.host)
    t.end()
  })
})


test('fail with system lookup', function (t) {
  process.env.DNS_MODE = 'A'
  var conc = concordant()
  conc.dns.resolve('wibble.testns.svc.cluster.local', function (err, results) {
    t.equal(nodeDns.NODATA, err)
    t.end()
  })
})


test('resove with direct lookup', function (t) {
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_MODE = 'A'
  var conc = concordant({dnsMode: 'A'})
  dnsMock.start(function () {
    conc.dns.resolve('service2.testns.svc.cluster.local', function (err, results) {
      t.equal(1, results.length)
      t.equal(null, err)
      t.equal('127.0.0.1', results[0].host)
      t.equal('127.0.0.1', results.host)
      dnsMock.stop()
      t.end()
    })
  })
})


test('fail with direct lookup', function (t) {
  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_PORT = 53053
  process.env.DNS_MODE = 'A'
  var conc = concordant()
  setImmediate(function () {
    dnsMock.start(function () {
      conc.dns.resolve('wibble.testns.svc.cluster.local', function (err, results) {
        t.equal(nodeDns.NODATA, err)
        dnsMock.stop()
        t.end()
      })
    })
  })
})

