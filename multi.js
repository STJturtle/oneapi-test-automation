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

async function createQuote(fullData, index) {
//   console.log(
//     `[${profile}] - getting ready with quote for`,
//     vertical,
//     `${url}${version}/v1/products/${vertical}/quotes`
//   )
try{
  const quoteData = fullData.quoteRequest;

  // console.log("quoteData - " + fullData.quoteRequest)
  // console.log("generalHeader - " + generalHeader)

  const response = await axios.post(`${url}${version}/v1/products/${vertical}/quotes`, quoteData, generalHeader)
  const data = await response.data;
  const element = data.data
    //   console.log(
    //     '[createQuote] referenceId = ',
    //     element.referenceId,
    //     ' quoteId = ',
    //     element.quoteId,
    //     ' Insurer Code = ',
    //     element.fetchQuoteLinks[0].insurerCode
    //   )

      // element.fetchQuoteLinks.forEach(async (innerElement) => {
      //   // await getQuote(element.referenceId, element.quoteId, innerElement.insurerCode)

      //   console.log()
      // })

  console.log(index + " : " + '1. --- quote with proposal ----')
  await getQuoteWithProposal(
    element.referenceId,
    element.quoteId,
    element.fetchQuoteLinks[0].insurerCode,
    fullData,
    index
  )
  console.log()
}
catch(error) {
  console.log("ERROR", error)
}

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
async function getQuoteWithProposal(referenceId, quoteId, insurerCode, fullData, index) {
  const response = await axios.get(`${url}${version}/v1/products/${vertical}/quotes/${quoteId}?insurerCode=${insurerCode}&referenceId=${referenceId}`,generalHeader)
  const responseData = await response.data;
  console.log(index + ": " + "2. getQuoteWithProposal", response)
  const data = responseData.data
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

  console.log(index + ":" + "3. proposalData: ", data.referenceId,  data.premiumResultId )
  await getProposal(data?.referenceId, data?.premiumResultId, fullData, index)
}

async function getProposal(referenceId, premiumResultId, fullData, index) {
//   console.log('creating proposal')

  proposalData = fullData.proposalRequest;

  proposalData.data.premiumResultId = premiumResultId
  proposalData.data.referenceId = referenceId

  console.log(index + ": " +"4 proposalData.data --> ", proposalData)

  const response = await axios.post(
      `${url}${version}/v1/products/${vertical}/proposals`,
      proposalData,
      generalHeader
    );
  const resposneData = await response.data;
    
  const data = resposneData.data

      // console.log(data?.insurerCode)
      console.log(index + ": " +'5. [getProposal] Proposal Id -- > ' + data?.proposalId)

      const tenant = paymentHeader.headers['x-tenant']
      const broker = paymentHeader.headers['x-broker']

      if (trxEnabled.includes(vertical)) {
        console.log(index + ": 6.", `curl --location --request POST '${url}/api/minterprise/v1/payments/${vertical}/transaction' \
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

      if (profile !== 'prod') {
          await checkTrxApi(referenceId, data?.proposalId,index)
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

        await generateLink(referenceId, data?.proposalId, fullData, index)
      }
    
    }
    else {
      await generateLink(referenceId, data?.proposalId, fullData, index)
    }
}

async function generateLink(referenceId, proposalId, fullData, index) {
  paymentData.data.referenceId = referenceId
  paymentData.data.proposalId = proposalId
  paymentData.data.insurerCode = "SVAAS";
  paymentData.data.productCode = "wellness";



  console.log(index + ": " + '6. fetching payment link')
  console.log(index + ": 7. " + JSON.stringify(paymentData))

  const response = await axios
    .post(
      `${url}${version}/v1/products/${vertical}/payments/link`,
      paymentData,
      paymentHeader
    )
  const data = await response.data;
    
      console.log('')
      console.log(`${url}/api/minterprise/v1/products/${vertical}/payments/link`)
      console.log('')
      console.log('Payment Link -- > ' + data.data.paymentLink)
      console.log('')
      console.log('')
      console.log(' - - - - - - - - - - - - - - - - - - - -')
}

async function checkTrxApi(referenceId, proposalId, index) {
  paymentData.data.referenceId = referenceId
  paymentData.data.proposalId = proposalId

  console.log(index + ": " +'7.checking from transaction api')

  const response =  await axios
    .post(
      `${url}${version}/v1/payments/${vertical}/transaction`,
      paymentData,
      paymentHeader
    )
    const data = await response.data;
      console.log('')
      console.log(`${url}/api/minterprise/v1/payments/${vertical}/transaction`)
      console.log('')
      console.log('trx response -- > ' + JSON.stringify(data, null, 4))
      console.log('')
      console.log('')
      console.log(' - - - - - - - - - - - - - - - - - - - -')
    
}

async function test() {
  for(let i=0; i < combinedData.length; i++) {
    try {
      await createQuote(combinedData[i], i)
    }
    catch(error) {
      console.log('Error at createQuote' + error)
    }
  }
}
test()
// combinedData.forEach(async (data, index) => {
//   try {
//     await createQuote(data, index)
//   }
//   catch(error) {
//     console.log('Error at createQuote' + error)
//   }
// })
    

function returnDateOfPurchase() {
  var today = new Date()
  var dd = String(today.getDate()).padStart(2, '0')
  var mm = String(today.getMonth() + 1).padStart(2, '0') //January is 0!
  var yyyy = today.getFullYear()

  return dd + '/' + mm + '/' + yyyy
}