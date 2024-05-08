import axios from 'axios';

export class ShopifyPlanetApi {
  private clientId: string;
  private token: string;

  constructor(params: {clientId: string; token: string}) {
    const {clientId, token} = params;
    if (!clientId || !token) throw new Error('Provide both: clientId and token');

    this.clientId = clientId;
    this.token = token;
  }

  // API methods
  async getShopInfo(variables: {
    shopifyDomain: string;
  }): Promise<{shop: {allShipmentsCarbonNeutral: boolean}}> {
    return this.call({
      query: `
      query GetShopInfo($shopifyDomain: String!) {
        shop(shopifyDomain: $shopifyDomain) {
            allShipmentsCarbonNeutral
        }
      } 
      `,
      variables,
    });
  }

  // Private methods
  private async call(data: {query: string; variables: Record<string, any>}) {
    const headers = (await this.getHeaders(JSON.stringify(data))) as any;
    const resp = await axios(this.getBaseUrl(), {
      method: 'post',
      data,
      headers,
    });
    return resp?.data?.data;
  }

  private async getHeaders(body: string) {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Shopify-Planet-Client-ID': this.clientId,
      'X-Shopify-Planet-Hmac-Sha256': await generateEncryptedToken(this.token, body),
    };
  }

  private getBaseUrl() {
    return 'https://shopify-planet.shopifyapps.com/api/graphql';
  }
}

const generateEncryptedToken = async (token: string, body: string) => {
  let encToken: string;

  // if browser -- https://github.com/flexdinesh/browser-or-node/blob/master/src/index.js
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    // TODO
    console.error('[shopify-planet-api] Crypto methods are not yet supported for Browser.');
  } else {
    // if server
    const createHmac = (await import('crypto')).createHmac;
    encToken = createHmac('sha256', token).update(Buffer.from(body)).digest('base64');
  }

  return encToken;
};
