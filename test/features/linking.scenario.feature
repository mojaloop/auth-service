Feature: Linking

Scenario: Return Challenge
  Given auth-service server
  When A PISP requests a challenge
  Then I issue a callback to the PISP with the blank credential object

Scenario: Disallow PISP Modifying Challenge in POST
  Given auth-service server
  When A PISP attempts to modify a challenge with `POST /consents/{id}`
  Then I respond with 405 Method Not Allowed

Scenario: Disallow PISP Modifying Challenge in PUT
  Given auth-service server
  When A PISP attempts to modify a challenge with a `PUT /consents/{id}`
  Then I respond with 400 Bad Request

Scenario: Invalid credentials from PISP
  Given auth-service server
    and existing consent of id "123"
    and a challenge for consent "123"
  When A PISP responds with an invalid credential in `PUT /consents/{id}`
  Then I send a `PUT /consents/123/error` to the PISP

Scenario: Update credential status
  Given auth-service server
    and existing consent of id "123"
    and a challenge for consent "123"
  When A PISP responds with a valid credential in `PUT /consents/{id}`
  Then I update the credential's status to "VERIFIED"
    and send a `PUT /consents/123` to the initiator and participant

Scenario: Disallow modifying the credential status
  Given auth-service server
    and existing consent of id "123"
    and a credential for consent "123"
  When Any party attempts to modify the credential's status
  Then I respond with a 400 Bad Request
  