const axios = require('axios').default

const hospicashQuoteData = require('./hospicash/quote.json')
const hospicashProposalData = require('./hospicash/proposal.json')
const hospicashPaymentData = require('./hospicash/payment.json')

const mobileQuoteData = require('./mobile/quote.json')
const mobileProposalData = require('./mobile/proposal.json')
const mobilePaymentData = require('./mobile/payment.json')

const shopQuoteData = require('./shop/quote.json')
const shopProposalData = require('./shop/proposal.json')
const shopPaymentData = require('./shop/payment.json')

const vectorborneQuoteData = require('./vector-borne/quote.json')
const vectorborneProposalData = require('./vector-borne/proposal.json')
const vectorbornePaymentData = require('./vector-borne/payment.json')

const creditlifeQuoteData = require('./credit-life/quote.json')
const creditlifeProposalData = require('./credit-life/proposal.json')
const creditlifePaymentData = require('./credit-life/payment.json')

// update hardcoded values
const vertical = 'shop'
const profile = 'prod'

const url =
  profile === 'local'
    ? 'http://localhost:9098'
    : profile === 'prod'
    ? 'https://app.turtlemint.com'
    : 'https://app.skyfall.turtle-feature.com'

const quoteData = eval(`${vertical}QuoteData`.replace(/-/g, ''))
const proposalData = eval(`${vertical}ProposalData`.replace(/-/g, ''))
const paymentData = eval(`${vertical}PaymentData`.replace(/-/g, ''))

const tenant = vertical === 'mobile' ? 'turtlemint' : 'pharmeasy'

async function createQuote() {
  console.log(`[${profile}] - getting ready with quote for`, vertical)
  axios
    .post(`${url}/api/minterprise/v1/products/${vertical}/quotes`, quoteData)
    .then(async (response) => {
      let element = response.data.data
      console.log(
        '[createQuote] referenceId = ',
        element.referenceId,
        ' quoteId = ',
        element.quoteId,
        ' Insurer Code = ',
        element.fetchQuoteLinks[0].insurerCode
      )

      element.fetchQuoteLinks.forEach(async (element) => {
        await getQuote(element.link)

        console.log()
      })

      console.log(' --- quote with proposal ----')
      await getQuoteWithProposal(element.fetchQuoteLinks[0].link)
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function getQuote(quoteURL) {
  console.log('quoteURL = ' + quoteURL)
  axios
    .get(`${quoteURL}`)
    .then(async (response) => {
      let data = response.data.data
      console.log(
        '[getQuote] referenceId = ',
        data?.referenceId,
        ' Premium Result Id = ',
        data?.premiumResultId,
        ' Insurer Code = ',
        data?.premiumResults.insurerCode
      )
      console.log(
        '[getQuote] total Premium = ',
        data?.premiumResults?.totalPremium,
        ' Net Premium = ',
        data?.premiumResults?.netPremium
      )

      //    await getProposal(data?.referenceId, data?.premiumResultId);
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}
async function getQuoteWithProposal(quoteURL) {
  axios
    .get(`${quoteURL}`)
    .then(async (response) => {
      let data = response.data.data
      console.log(
        '[getQuoteWithProposal] referenceId = ',
        data?.referenceId,
        ' Premium Result Id = ',
        data?.premiumResultId,
        ' Insurer Code = ',
        data?.premiumResults.insurerCode
      )
      console.log(
        '[getQuoteWithProposal] total Premium = ',
        data?.premiumResults?.totalPremium,
        ' Net Premium = ',
        data?.premiumResults?.netPremium
      )

      await getProposal(data?.referenceId, data?.premiumResultId)
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function getProposal(referenceId, premiumResultId) {
  console.log('creating proposal')
  console.log()

  proposalData.data.premiumResultId = premiumResultId
  proposalData.data.referenceId = referenceId

  axios
    .post(`${url}/api/minterprise/v1/products/${vertical}/proposals`, proposalData)
    .then(async (response) => {
      let data = response.data.data

      // console.log(data?.insurerCode)
      console.log('[getProposal] Proposal Id -- > ' + data?.proposalId)

      console.log(`curl --location --request POST '$${url}/api/minterprise/v1/products/${vertical}/payments/link' \
            --header 'x-tenant: pharmeasy' \
            --header 'x-broker: turtlemint' \
            --header 'Content-Type: application/json' \
            --data-raw '{
                "data": {
                    "productCode": "${vertical}",
                    "insurerCode": "${data?.insurerCode}",
                    "proposalId": "${data?.proposalId}",
                    "referenceId": "${referenceId}"
                }
            }'`)

      await generateLink(referenceId, data?.proposalId)
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function generateLink(referenceId, proposalId) {
  paymentData.data.referenceId = referenceId
  paymentData.data.proposalId = proposalId

  console.log('fetching payment link')
  await axios
    .post(`${url}/api/minterprise/v1/products/${vertical}/payments/link`, paymentData)
    .then((response) => {
      console.log(`${url}/api/minterprise/v1/products/${vertical}/payments/link`)
      console.log('Payment Link -- > ' + response.data.data.paymentLink)
    })
    .catch(function (error) {
      console.log('error' + error)
    })
}

createQuote()
