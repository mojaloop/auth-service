#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unreachable */
/* eslint-disable no-fallthrough */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-use-before-define */
'use strict'

var main = (function () {
  var _ref = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee () {
    var waitingMap, allHealthy
    return regeneratorRuntime.wrap(function _callee$ (_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            waitingMap = {}
            // serviceName => status, where status is healthy, unhealthy or starting

            expectedContainers.forEach(function (serviceName) {
              waitingMap[serviceName] = 'starting'
            })

            _context.prev = 2
            _context.next = 5
            return areAllServicesHealthy(waitingMap, waitTimeMs)

          case 5:
            allHealthy = _context.sent

          case 6:
            if (!(!allHealthy && retries > 0)) {
              _context.next = 20
              break
            }

            _context.next = 9
            return sleep(waitTimeMs)

          case 9:
            _context.next = 11
            return areAllServicesHealthy(waitingMap, waitTimeMs)

          case 11:
            allHealthy = _context.sent

            if (!(retries === 0)) {
              _context.next = 14
              break
            }

            throw new Error('Out of retries waiting for service health.\nStill waiting for: ' + getServicesForStatus(waitingMap, 'starting'))

          case 14:

            console.log('Still waiting for service health. Retries', retries)
            console.log(getServicesForStatus(waitingMap, 'healthy').length + ' services are healthy. Expected: ' + expectedContainers.length)
            console.log('Waiting for', getServicesForStatus(waitingMap, 'starting'))

            retries--
            _context.next = 6
            break

          case 20:

            console.log('All services are healthy. Time to get to work!')
            process.exit(0)
            _context.next = 28
            break

          case 24:
            _context.prev = 24
            _context.t0 = _context.catch(2)

            console.error('_wait4_all: ' + _context.t0)
            process.exit(1)

          case 28:
          case 'end':
            return _context.stop()
        }
      }
    }, _callee, this, [[2, 24]])
  }))

  return function main () {
    return _ref.apply(this, arguments)
  }
}())

/**
 * @function areAllServicesHealthy
 * @description Get Update the service status, and sleep for `waitTimeMs` if the services aren't healthy
 * @param {*} waitingMap
 * @returns boolean
 */

var areAllServicesHealthy = (function () {
  var _ref2 = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee2 (waitingMap) {
    return regeneratorRuntime.wrap(function _callee2$ (_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2
            return updateServiceStatus(waitingMap)

          case 2:
            if (!isSystemHealthy(waitingMap)) {
              _context2.next = 4
              break
            }

            return _context2.abrupt('return', true)

          case 4:
            if (!isSystemFailing(waitingMap)) {
              _context2.next = 6
              break
            }

            throw new Error('One or more services went to unhealthy: \n\t' + getServicesForStatus(waitingMap, 'unhealthy') + '\n')

          case 6:
            return _context2.abrupt('return', false)

          case 7:
          case 'end':
            return _context2.stop()
        }
      }
    }, _callee2, this)
  }))

  return function areAllServicesHealthy (_x) {
    return _ref2.apply(this, arguments)
  }
}())

/**
 * @function updateServiceStatus
 * @description Go through all of the waiting services, and check their status
 * @param {*} waitingMap
 * @returns void
 */

var updateServiceStatus = (function () {
  var _ref3 = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee4 (waitingMap) {
    var _this = this

    var startingServices
    return regeneratorRuntime.wrap(function _callee4$ (_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            startingServices = getServicesForStatus(waitingMap, 'starting')

            Promise.all(startingServices.map(function () {
              var _ref4 = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee3 (serviceName) {
                var currentStatus, progress
                return regeneratorRuntime.wrap(function _callee3$ (_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        currentStatus = waitingMap[serviceName]
                        _context3.next = 3
                        return getProgress(serviceName)

                      case 3:
                        progress = _context3.sent

                        waitingMap[serviceName] = progress

                      case 5:
                      case 'end':
                        return _context3.stop()
                    }
                  }
                }, _callee3, _this)
              }))

              return function (_x3) {
                return _ref4.apply(this, arguments)
              }
            }()))

          case 2:
          case 'end':
            return _context4.stop()
        }
      }
    }, _callee4, this)
  }))

  return function updateServiceStatus (_x2) {
    return _ref3.apply(this, arguments)
  }
}())

/**
 * @function getProgress
 * @description Invokes the `docker inspect` command for the given container
 * @param {string} containerName
 * @returns {'healthy' | 'unhealthy' | 'starting'}
 */

/**
 * @function sleep
 * @param {*} timeMs - how long to sleep for
 */
var sleep = (function () {
  var _ref5 = _asyncToGenerator(/* #__PURE__ */regeneratorRuntime.mark(function _callee5 (timeMs) {
    return regeneratorRuntime.wrap(function _callee5$ (_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log('Sleeping for ' + timeMs + ' ms')
            return _context5.abrupt('return', new Promise(function (resolve, reject) {
              return setTimeout(function () {
                return resolve()
              }, timeMs)
            }))

          case 2:
          case 'end':
            return _context5.stop()
        }
      }
    }, _callee5, this)
  }))

  return function sleep (_x4) {
    return _ref5.apply(this, arguments)
  }
}())

var _child_process = require('child_process')

function _asyncToGenerator (fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step (key, arg) { try { var info = gen[key](arg); var value = info.value } catch (error) { reject(error); return } if (info.done) { resolve(value) } else { return Promise.resolve(value).then(function (value) { step('next', value) }, function (err) { step('throw', err) }) } } return step('next') }) } }

/**
 * @file _wait4_all.js
 * @description Waits for all docker-compose services to be running and healthy
 */

// Define the docker-compose containers you want to monitor here
var expectedContainers = ['as_auth-service', 'as_mysql']

var retries = 15
var waitTimeMs = 10000

function getProgress (containerName) {
  var command = 'docker inspect --format=\'{{json .State.Health.Status}}\' ' + containerName
  return (0, _child_process.execSync)(command).toString().replace(/['"]+|[\n]+/g, '')
}

/**
 * @function isSystemHealthy
 * @param {*} waitingMap
 * @returns {boolean}
 */
function isSystemHealthy (waitingMap) {
  return getServicesForStatus(waitingMap, 'healthy').length === expectedContainers.length
}

/**
 * @function isSystemFailing
 * @param {*} waitingMap
 * @returns {boolean}
 */
function isSystemFailing (waitingMap) {
  return getServicesForStatus(waitingMap, 'unhealthy').length > 0
}

/**
 * @function getServicesForStatus
 * @param {*} waitingMap
 * @param {'healthy' | 'unhealthy' | 'starting'} status
 * @returns {Array<string>}
 */
function getServicesForStatus (waitingMap, status) {
  return Object.keys(waitingMap).filter(function (k) {
    return waitingMap[k] === status
  })
}

main()
