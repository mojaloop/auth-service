import { IConsent } from '../model/consent';

/*
  We are in the business domain here - write business logic
*/
export class Consent {
  consentModel: any;


  constructor(consentModel: any) {
    this.consentModel = consentModel
  }

  // The issue with using IConsent, is that it's crossing domains
  // IConsent is from model domain, and not the business domain
  async getConsents(): Promise<Array<IConsent>> {
    // const consents = this.consentModel.getAllConsents();
    const consents = await this.consentModel.getAllConsents();

    // example only...
    if (consents.length === 0) {
      throw new Error('No consents found')
    }

    return consents;
  }

}


/* Dependency Injection */

// TODO: make not any
const makeConsent = (consentModel: any) => {
  const consent = new Consent(consentModel);

  return consent;
}


export default makeConsent
