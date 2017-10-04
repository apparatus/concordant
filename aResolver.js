/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES LOSS OF USE, DATA, OR PROFITS OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

var assert = require('assert')
var dns = require('dns')
var dnsSocket = require('dns-socket')


/**
 * dns based service resolution host only.
 * perfom an A query either directly or using the system based dns settings
 */
module.exports = function (opts) {
  assert(opts)
  assert(opts.mode)


  function lookupDirect (query, cb) {
    var client = dnsSocket()
    var result = []

    client.query({questions: [{type: 'A', name: query}]}, opts.port, opts.host, function (err, serviceA) {
      if (err) { return cb(err) }
      if (serviceA.answers && serviceA.answers.length > 0) {
        serviceA.answers.forEach(function (a) {
          result.push({host: a.data})
        })
      }
      client.destroy()
      if (result.length > 0) {
        result.host = result[0].host
        cb(err, result)
      } else {
        cb(dns.NODATA)
      }
    })
  }


  function lookupSystem (query, cb) {
    var result = []

    dns.resolve4(query, function (err, addressesA) {
      if (err) { return cb(err) }
      if (addressesA && addressesA.length > 0) {
        addressesA.forEach(function (a) {
          result.push({host: a})
        })
      }
      if (result.length > 0) {
        result.host = result[0].host
        cb(err, result)
      } else {
        cb(dns.NODATA)
      }
    })
  }


  function resolve (query, cb) {
    if (opts.mode === 'direct') {
      lookupDirect(query, cb)
    } else {
      lookupSystem(query, cb)
    }
  }


  return {
    resolve: resolve
  }
}

