Feature: AuthService server

Scenario: Health Check
  Given AuthService server
  When I get 'Health Check' response
  Then The status should be 'OK'

Scenario: Hello
  Given AuthService server
  When I get 'Hello' response
  Then I see 'Hello world'