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
var async = require('async')
var dns = require('dns')
var dnsSocket = require('dns-socket')


/**
 * dns based service resolution. performs resolution by first running an SRV query,
 * followed by an A query on the resultant cname records returned
 */
module.exports = function (opts) {
  assert(opts)
  assert(opts.mode)

  function lookupDirect (query, cb) {
    var client = dnsSocket()
    var result = []

    client.query({questions: [{type: 'SRV', name: query}]}, opts.port, opts.host, function (err, serviceSRV) {
      if (err) { return cb(err) }

      if (serviceSRV.answers && serviceSRV.answers.length > 0) {
        async.eachSeries(serviceSRV.answers, function (answer, next) {

          client.query({questions: [{type: 'A', name: answer.data.target}]}, opts.port, opts.host, function (err, serviceA) {
            if (err) { return next(err) }
            if (serviceA.answers && serviceA.answers.length > 0) {
              result.push({port: answer.data.port, host: serviceA.answers[0].data})
              next()
            } else {
              next(dns.NODATA)
            }
          })
        }, function (err) {
          client.destroy()
          cb(err, result)
        })
      } else {
        client.destroy()
        cb(dns.NODATA)
      }
    })
  }



  function lookupSystem (query, cb) {
    var result = []

    dns.resolveSrv(query, function (err, addressesSRV) {
      if (err) { return cb(err) }
      if (addressesSRV && addressesSRV.length > 0) {
        async.eachSeries(addressesSRV, function (addressSRV, next) {
          dns.resolve4(addressSRV.name, function (err, addressesA) {
            if (err) { return next(err) }
            if (addressesA && addressesA.length > 0) {
              result.push({port: addressSRV.port, host: addressesA[0].address})
              next()
            } else {
              next(dns.NODATA)
            }
          })
        }, function (err) {
          cb(err, result)
        })
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

