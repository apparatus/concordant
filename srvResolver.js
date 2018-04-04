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
var asnc = require('async')
var dns = require('dns')
var dnsSocket = require('dns-socket')


/**
 * DNS-based service resolution. Performs resolution by first running an SRV query,
 * optionally followed by an A query on the resultant cname records returned
 */
module.exports = function (opts) {
  assert(opts)
  assert(opts.mode)

  var lookup = opts.mode === 'direct' ? lookupDirect : lookupSystem

  function lookupDirect (query, srvOnly, cb) {
    var client = dnsSocket()
    var result = []

    client.query({questions: [{type: 'SRV', name: query}]}, opts.port, opts.host, function (err, serviceSRV) {
      if (err) { return cb(err) }

      if (serviceSRV.answers && serviceSRV.answers.length > 0) {
        if (srvOnly) {
          client.destroy()
          return cb(null, serviceSRV.answers.map(function (answer) {
            return {host: answer.data.target, port: answer.data.port}
          }))
        }

        // Lookup IP address for A record
        asnc.eachSeries(serviceSRV.answers, function (answer, next) {

          client.query({questions: [{type: 'A', name: answer.data.target}]}, opts.port, opts.host, function (err, serviceA) {
            if (err) { return next(err) }
            if (serviceA.answers && serviceA.answers.length > 0) {
              serviceA.answers.forEach(function (a) {
                result.push({port: answer.data.port, host: a.data})
              })
              next()
            } else {
              next(dns.NODATA)
            }
          })
        }, function (err) {
          client.destroy()
          if (result.length > 0) {
            result.host = result[0].host
            result.port = result[0].port
          }
          cb(err, result)
        })
      } else {
        client.destroy()
        cb(dns.NODATA)
      }
    })
  }



  function lookupSystem (query, srvOnly, cb) {
    var result = []

    dns.resolveSrv(query, function (err, addressesSRV) {
      if (err) { return cb(err) }
      if (addressesSRV && addressesSRV.length > 0) {
        if (srvOnly) {
          return cb(null, addressesSRV.map(function (addressSRV) {
            return {host: addressSRV.name, port: addressSRV.port}
          }))
        }
        asnc.eachSeries(addressesSRV, function (addressSRV, next) {
          dns.resolve4(addressSRV.name, function (err, addressesA) {
            if (err) { return next(err) }
            if (addressesA && addressesA.length > 0) {
              addressesA.forEach(function (a) {
                result.push({port: addressSRV.port, host: a})
              })
              next()
            } else {
              next(dns.NODATA)
            }
          })
        }, function (err) {
          if (result.length > 0) {
            result.host = result[0].host
            result.port = result[0].port
          }
          cb(err, result)
        })
      } else {
        cb(dns.NODATA)
      }
    })
  }


  function resolveSrv (query, cb) {
    lookup(query, true, cb)
  }

  function resolve (query, cb) {
    lookup(query, false, cb)
  }


  return {
    resolve: resolve,
    resolveSrv: resolveSrv
  }
}

