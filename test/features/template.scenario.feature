Feature: auth-service server

Scenario: Health Check
  Given auth-service server
  When I get 'Health Check' response
  Then The status should be 'OK'
