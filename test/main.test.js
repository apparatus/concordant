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
proxyquire('../dnsResolver', {dns: dnsMock.systemStub})
var concordant = require('../index')
var nodeDns = require('dns')


test('resove with system lookup', function (t) {
  t.plan(4)

  var conc = concordant()
  conc.dns.resolve('_tcp._tcp.service2.testns.svc.cluster.local', function (err, results) {
    t.equal(1, results.length)
    t.equal(null, err)
    t.equal('127.0.0.1', results[0].host)
    t.equal(3002, results[0].port)
  })
})


test('fail with system lookup', function (t) {
  t.plan(1)

  var conc = concordant()
  conc.dns.resolve('_tcp._tcp.wibble.testns.svc.cluster.local', function (err, results) {
    t.equal(nodeDns.NODATA, err)
  })
})


test('missing A record with system lookup', function (t) {
  t.plan(1)

  var conc = concordant()
  conc.dns.resolve('_tcp._tcp.badrecord.testns.svc.cluster.local', function (err, results) {
    t.equal(nodeDns.NODATA, err)
  })
})


test('resove with direct lookup', function (t) {
  t.plan(4)

  process.env.DNS_HOST = '127.0.0.1'
  var conc = concordant()
  dnsMock.start(function () {
    conc.dns.resolve('_tcp._tcp.service2.testns.svc.cluster.local', function (err, results) {
      t.equal(1, results.length)
      t.equal(null, err)
      t.equal('127.0.0.1', results[0].host)
      t.equal(3002, results[0].port)
      dnsMock.stop()
    })
  })
})


test('fail with direct lookup', function (t) {
  t.plan(1)

  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_PORT = 53053
  var conc = concordant()
  setImmediate(function () {
    dnsMock.start(function () {
      conc.dns.resolve('_tcp._tcp.wibble.testns.svc.cluster.local', function (err, results) {
        console.log(err)
        t.equal(nodeDns.NODATA, err)
        dnsMock.stop()
      })
    })
  })
})


test('mising A record with direct lookup', function (t) {
  t.plan(1)

  process.env.DNS_HOST = '127.0.0.1'
  process.env.DNS_PORT = 53053
  var conc = concordant()
  setImmediate(function () {
    dnsMock.start(function () {
      conc.dns.resolve('_tcp._tcp.badrecord.testns.svc.cluster.local', function (err, results) {
        console.log(err)
        t.equal(nodeDns.NODATA, err)
        dnsMock.stop()
      })
    })
  })
})

