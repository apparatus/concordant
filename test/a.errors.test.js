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
proxyquire('../aResolver', {dns: dnsMock.systemStub, 'dns-socket': dnsMock.dnsErrorSocketStub})
var concordant = require('../index')


test('test error lookup with system dns', function (t) {
  process.env.DNS_MODE = 'A'
  dnsMock.setErrorA(false)
  var conc = concordant()
  conc.dns.resolve('badrecord.testns.svc.cluster.local', function (err, results) {
    t.notequal(null, err, 'test error condition on bad lookup')
    t.equal(err, 'ENODATA', 'test that error is no data from dns')
    t.end()
  })
})


test('test error lookup with direct dns', function (t) {
  process.env.DNS_MODE = 'A'
  process.env.DNS_PORT = 53053
  process.env.DNS_HOST = '127.0.0.1'
  dnsMock.setErrorSRV(false)
  dnsMock.setErrorA(true)

  var conc = concordant()
  dnsMock.start(function () {
    conc.dns.resolve('service1.testns.svc.cluster.local', function (err, results) {
      t.notequal(null, err, 'test error condition on bad lookup')
      t.equal(err, 'force error on A', 'test that error is no data from dns')
      dnsMock.stop()
      t.end()
    })
  })
})

