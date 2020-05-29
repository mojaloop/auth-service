Feature: auth-service server

Scenario: Health Check
  Given auth-service server
  When I get 'Health Check' response
  Then The status should be 'OK'

Scenario: Hello
  Given auth-service server
  When I get 'Hello' response
  Then I see 'Hello world'