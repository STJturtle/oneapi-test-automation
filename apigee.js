const axios = require('axios').default

const hospicashQuoteData = require('./hospicash/quote.json')
const hospicashProposalData = require('./hospicash/proposal.json')
const hospicashPaymentData = require('./hospicash/payment.json')
const hospicashHeaderData = require('./hospicash/header.json')

const mobileQuoteData = require('./mobile/quote.json')
const mobileProposalData = require('./mobile/proposal.json')
const mobilePaymentData = require('./mobile/payment.json')
const mobileHeaderData = require('./mobile/header.json')

const shopQuoteData = require('./shop/quote.json')
const shopProposalData = require('./shop/proposal.json')
const shopPaymentData = require('./shop/payment.json')
const shopHeaderData = require('./shop/header.json')

const vectorborneQuoteData = require('./vector-borne/quote.json')
const vectorborneProposalData = require('./vector-borne/proposal.json')
const vectorbornePaymentData = require('./vector-borne/payment.json')

const creditlifeQuoteData = require('./credit-life/quote.json')
const creditlifeProposalData = require('./credit-life/proposal.json')
const creditlifePaymentData = require('./credit-life/payment.json')
const creditlifeHeaderData = require('./credit-life/header.json')

const grouppersonalaccidentQuoteData = require('./group-personal-accident/quote.json')
const grouppersonalaccidentProposalData = require('./group-personal-accident/proposal.json')
const grouppersonalaccidentPaymentData = require('./group-personal-accident/payment.json')
const grouppersonalaccidentHeaderData = require('./group-personal-accident/header.json')

const health360QuoteData = require('./health-360/quote.json')
const health360ProposalData = require('./health-360/proposal.json')
const health360PaymentData = require('./health-360/payment.json')
const health360HeaderData = require('./health-360/header.json')

const {
  APIGEE_UAT,
  APIGEE_PROD,
  APIGEE_VERSION,
  APIGEE_TOKEN,
  trxEnabled,
} = require('./constants.js')

const vertical = process.argv[3]
const profile = process.argv[2]
const appName = process.argv[4]

const defaultHeaderData = {
  headers: {
    'x-tenant': 'turtlemint',
    'x-broker': 'turtlemint',
    Authorization: APIGEE_TOKEN,
  },
}
var url
var version

url = profile === 'uat' ? APIGEE_UAT : APIGEE_PROD

version = APIGEE_VERSION

const quoteData = eval(`${vertical}QuoteData`.replace(/-/g, ''))
const proposalData = eval(`${vertical}ProposalData`.replace(/-/g, ''))
const paymentData = eval(`${vertical}PaymentData`.replace(/-/g, ''))
let paymentHeader

// try {
//   paymentHeader = eval(`${vertical}HeaderData`.replace(/-/g, ''))
// } catch (e) {
//   paymentHeader = defaultHeaderData
// }

// console.log('paymentHeader.headers ', paymentHeader.headers)
// paymentHeader.headers.Authorization = APIGEE_TOKEN

async function createQuote() {
  console.log(
    `[${profile}] - getting ready with quote for`,
    vertical,
    `${url}${version}/v1/products/${vertical}/quotes`
  )

  axios
    .post(`${url}${version}/v1/products/${vertical}/quotes`, quoteData, defaultHeaderData)
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

      console.log(' --- quote with proposal ----')

      await getQuoteWithProposal(element.referenceId, element.fetchQuoteLinks[0].link)
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}

console.log('payment request headers', defaultHeaderData)

async function getQuoteWithProposal(referenceId, quoteURL) {
  axios
    .get(`${quoteURL}`, defaultHeaderData)
    .then(async (response) => {
      let data = response.data.data
      data.referenceId = referenceId
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

  proposalData.data.premiumResultId = premiumResultId
  proposalData.data.referenceId = referenceId
  proposalData.data.otherDetails.dateOfPurchase = returnDateOfPurchase()

  axios
    .post(
      `${url}${version}/v1/products/${vertical}/proposals`,
      proposalData,
      defaultHeaderData
    )
    .then(async (response) => {
      let data = response.data.data

      // console.log(data?.insurerCode)
      console.log('[getProposal] Proposal Id -- > ' + data?.proposalId)

      console.log('paymentHeader = ' + JSON.stringify(defaultHeaderData))

      if (trxEnabled.includes(vertical)) {
        await checkTrxApi(referenceId, data?.proposalId)
      } else {
        await generateLink(referenceId, data?.proposalId)
      }
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
    .post(
      `${url}${version}/v1/products/${vertical}/payments/link`,
      paymentData,
      defaultHeaderData
    )
    .then((response) => {
      console.log('')
      console.log(`${url}/api/minterprise/v1/products/${vertical}/payments/link`)
      console.log('')
      console.log('Payment Link -- > ' + response.data.data.paymentLink)
      console.log('')
      console.log('')
      console.log(' - - - - - - - - - - - - - - - - - - - -')
    })
    .catch(function (error) {
      console.log('error' + error)
    })
}

async function checkTrxApi(referenceId, proposalId) {
  paymentData.data.referenceId = referenceId
  paymentData.data.proposalId = proposalId

  console.log('checking from transaction api')

  await axios
    .post(
      `${url}${version}/v1/payments/${vertical}/transaction`,
      paymentData,
      defaultHeaderData
    )
    .then((response) => {
      console.log('')
      console.log(`${url}/api/minterprise/v1/payments/${vertical}/transaction`)
      console.log('')
      console.log('trx response -- > ' + JSON.stringify(response.data.data, null, 4))
      console.log('')
      console.log('')
      console.log(' - - - - - - - - - - - - - - - - - - - -')
    })
    .catch(function (error) {
      console.log('error' + error)
    })
}

createQuote()

function returnDateOfPurchase() {
  var today = new Date()
  var dd = String(today.getDate()).padStart(2, '0')
  var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
  var yyyy = today.getFullYear()

  return dd + '/' + mm + '/' + yyyy
}
