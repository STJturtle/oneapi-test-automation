const axios = require("axios").default;

const hospicashQuoteData = require("./hospicash/quote.json");
const hospicashProposalData = require("./hospicash/proposal.json");
const hospicashPaymentData = require("./hospicash/payment.json");

const mobileQuoteData = require("./mobile/quote.json");
const mobileProposalData = require("./mobile/proposal.json");
const mobilePaymentData = require("./mobile/payment.json");

// update hardcoded values
const vertical = "hospicash";
const profile = "local";

const url = profile==="local" ? "http://localhost:9098" : "https://app.skyfall.turtle-feature.com";
const quoteData = vertical === "hospicash" ? hospicashQuoteData : mobileQuoteData;
const proposalData = vertical === "hospicash" ? hospicashProposalData : mobileProposalData;
const paymentData = vertical === "hospicash" ? hospicashPaymentData : mobilePaymentData;

async function createQuote() {
    console.log("getting ready with quote for", vertical)
     axios
        .post(
            `${url}/api/minterprise/v1/products/${vertical}/quotes`, quoteData
        )
        .then(async (response) => {
            console.log("referenceId = " , response.data.data.referenceId, " quoteId = " ,response.data.data.quoteId, " Insurer Code = " ,response.data.data.fetchQuoteLinks[0].insurerCode);
            await getQuote(response.data.data.referenceId, response.data.data.quoteId, response.data.data.fetchQuoteLinks[0].insurerCode);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function getQuote(referenceId, quoteId, insurerCode) {
     axios
        .get(
            `${url}/api/minterprise/v1/products/${vertical}/quotes/${quoteId}?insurerCode=${insurerCode}&referenceId=${referenceId}`
        )
        .then(function (response) {
            console.log("referenceId = " , response.data.data.referenceId, " Premium Result Id = " ,response.data.data.premiumResultId);
            getProposal(response.data.data.referenceId, response.data.data.premiumResultId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function getProposal(referenceId, premiumResultId) {
    console.log("creating proposal");

    proposalData.data.premiumResultId = premiumResultId;
    proposalData.data.referenceId = referenceId;

    axios
        .post(
            `${url}/api/minterprise/v1/products/${vertical}/proposals`,
            proposalData
        )
        .then((response) => {
            console.log("Proposal Id -- > " + (response.data.data.proposalId));
            generateLink(referenceId, response.data.data.proposalId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function generateLink(referenceId, proposalId) {

    paymentData.data.referenceId = referenceId;
    paymentData.data.proposalId = proposalId;

    console.log("fetching payment link");
    await axios
        .post(
            `${url}/api/minterprise/v1/products/${vertical}/payments/link`,
            paymentData
        )
        .then((response) => {
            console.log("Payment Link -- > " + (response.data.data.paymentLink));
        })
        .catch(function (error) {
            console.log("error"+ error);
        });
}

createQuote();

