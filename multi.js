const axios = require('axios').default


const wellnessCombinedData = require('./wellness/combined.json')
const wellnessHeaderData = require('./wellness/header.json')
const wellnessPaymentData = require('./wellness/payment.json')

const {
  MINTERPRISE_LOCAL,
  MINTERPRISE_UAT,
  MINTERPRISE_PROD,
  MINTERPRISE_VERSION,
  trxEnabled,
} = require('./constants.js')

const vertical = process.argv[3]
const profile = process.argv[2]

const defaultHeaderData = {
  headers: {
    'x-tenant': 'turtlemint',
    'x-broker': 'turtlemint',
  },
}
var url
var version

url =
  profile === 'local'
    ? MINTERPRISE_LOCAL
    : profile === 'prod'
    ? MINTERPRISE_PROD
    : MINTERPRISE_UAT

version = MINTERPRISE_VERSION

const paymentData = eval(`${vertical}PaymentData`.replace(/-/g, ''))
const combinedData = eval(`${vertical}CombinedData`.replace(/-/g, ''))

let generalHeader
let paymentHeader

try {
  generalHeader = eval(`${vertical}HeaderData`.replace(/-/g, '')).general
  paymentHeader = eval(`${vertical}HeaderData`.replace(/-/g, '')).payment
} catch (e) {
  generalHeader = defaultHeaderData
  paymentHeader = defaultHeaderData
}

// console.log('general Header -> ', generalHeader)
// console.log('payment Header -> ', paymentHeader)

async function createQuote(fullData) {
//   console.log(
//     `[${profile}] - getting ready with quote for`,
//     vertical,
//     `${url}${version}/v1/products/${vertical}/quotes`
//   )

  const quoteData = fullData.quoteRequest;

  // console.log("quoteData - " + fullData.quoteRequest)
  // console.log("generalHeader - " + generalHeader)

  axios
    .post(`${url}${version}/v1/products/${vertical}/quotes`, quoteData, generalHeader)
    .then(async (response) => {
      let element = response.data.data
    //   console.log(
    //     '[createQuote] referenceId = ',
    //     element.referenceId,
    //     ' quoteId = ',
    //     element.quoteId,
    //     ' Insurer Code = ',
    //     element.fetchQuoteLinks[0].insurerCode
    //   )

      element.fetchQuoteLinks.forEach(async (innerElement) => {
        // await getQuote(element.referenceId, element.quoteId, innerElement.insurerCode)

        console.log()
      })

      console.log(' --- quote with proposal ----')
      await getQuoteWithProposal(
        element.referenceId,
        element.quoteId,
        element.fetchQuoteLinks[0].insurerCode,
        fullData
      )
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function getQuote(referenceId, quoteId, insurerCode) {
  // console.log('quoteURL = ' + quoteURL)
  axios
    .get(
      `${url}${version}/v1/products/${vertical}/quotes/${quoteId}?insurerCode=${insurerCode}&referenceId=${referenceId}`,
      generalHeader
    )
    .then(async (response) => {
      let data = response.data.data
    //   console.log(
    //     '[getQuote] referenceId = ',
    //     data?.referenceId,
    //     ' Premium Result Id = ',
    //     data?.premiumResultId,
    //     ' Insurer Code = ',
    //     data?.premiumResults.insurerCode
    //   )
    //   console.log(
    //     '[getQuote] total Premium = ',
    //     data?.premiumResults?.totalPremium,
    //     ' Net Premium = ',
    //     data?.premiumResults?.netPremium
    //   )

      //    await getProposal(data?.referenceId, data?.premiumResultId);
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}
async function getQuoteWithProposal(referenceId, quoteId, insurerCode, fullData) {
  axios
    .get(
      `${url}${version}/v1/products/${vertical}/quotes/${quoteId}?insurerCode=${insurerCode}&referenceId=${referenceId}`,
      generalHeader
    )
    .then(async (response) => {
      let data = response.data.data
    //   console.log(
    //     '[getQuoteWithProposal] referenceId = ',
    //     data?.referenceId,
    //     ' Premium Result Id = ',
    //     data?.premiumResultId,
    //     ' Insurer Code = ',
    //     data?.premiumResults.insurerCode
    //   )
    //   console.log(
    //     '[getQuoteWithProposal] total Premium = ',
    //     data?.premiumResults?.totalPremium,
    //     ' Net Premium = ',
    //     data?.premiumResults?.netPremium
    //   )

      await getProposal(data?.referenceId, data?.premiumResultId, fullData)
      console.log()
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function getProposal(referenceId, premiumResultId, fullData) {
//   console.log('creating proposal')

  proposalData = fullData.proposalRequest;

  proposalData.data.premiumResultId = premiumResultId
  proposalData.data.referenceId = referenceId

//   console.log("proposalData.data --> ", proposalData)

  axios
    .post(
      `${url}${version}/v1/products/${vertical}/proposals`,
      proposalData,
      generalHeader
    )
    .then(async (response) => {
      let data = response.data.data

      // console.log(data?.insurerCode)
    //   console.log('[getProposal] Proposal Id -- > ' + data?.proposalId)

      const tenant = paymentHeader.headers['x-tenant']
      const broker = paymentHeader.headers['x-broker']

      if (trxEnabled.includes(vertical)) {
        console.log(`curl --location --request POST '${url}/api/minterprise/v1/payments/${vertical}/transaction' \
        --header 'x-tenant: ${tenant}' \
        --header 'x-broker: ${broker}' \
        --header 'Content-Type: application/json' \
        --data-raw '{
            "data": {
              "productCode": "${vertical}",
              "insurerCode": "${data?.insurerCode}",
              "proposalId": "${data?.proposalId}",
              "referenceId": "${referenceId}",
              "transactionStatus":"SUCCESS",
              "transactionId":"Order_ABCDEF"
            }
        }'`)

        // console.log('paymentHeader = ' + JSON.stringify(paymentHeader))

        if (profile !== 'prod') await checkTrxApi(referenceId, data?.proposalId)
      } else {
        console.log(`curl --location --request POST '${url}/api/minterprise/v1/products/${vertical}/payments/link' \
        --header 'x-tenant: ${tenant}' \
        --header 'x-broker: ${broker}' \
        --header 'Authorization: Bearer ${paymentHeader.headers['Authorization']}' \
        --header 'Content-Type: application/json' \
        --data-raw '{
            "data": {
                "productCode": "${vertical}",
                "insurerCode": "${data?.insurerCode}",
                "proposalId": "${data?.proposalId}",
                "referenceId": "${referenceId}"
            }
        }'`)

        // console.log('paymentHeader = ' + JSON.stringify(paymentHeader))

        await generateLink(referenceId, data?.proposalId, fullData)
      }
    })
    .catch(function (error) {
      console.log(error)
    })
}

async function generateLink(referenceId, proposalId, fullData) {
  paymentData.data.referenceId = referenceId
  paymentData.data.proposalId = proposalId

  console.log('fetching payment link')

  await axios
    .post(
      `${url}${version}/v1/products/${vertical}/payments/link`,
      paymentData,
      paymentHeader
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
      paymentHeader
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


combinedData.forEach((data) => {
    createQuote(data)
})
    

function returnDateOfPurchase() {
  var today = new Date()
  var dd = String(today.getDate()).padStart(2, '0')
  var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
  var yyyy = today.getFullYear()

  return dd + '/' + mm + '/' + yyyy
}
