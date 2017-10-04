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

var srvResolver = require('./srvResolver')
var aResolver = require('./aResolver')


module.exports = function (globalOpts) {
  var opts = {}
  var resolver = srvResolver


  if (process.env.DNS_HOST) {
    opts.dns = {
      mode: 'direct',
      host: process.env.DNS_HOST,
      port: process.env.DNS_PORT || 53053
    }
  } else {
    opts.dns = { mode: 'system' }
  }

  if (process.env.DNS_MODE === 'A' || (globalOpts && globalOpts.dnsMode === 'A')) {
    resolver = aResolver
  }


  return {
    dns: resolver(opts.dns)
  }
}

