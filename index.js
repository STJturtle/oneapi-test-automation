const axios = require("axios").default;

const hospicashQuoteData = require("./hospicash/quote.json");
const hospicashProposalData = require("./hospicash/proposal.json");
const hospicashPaymentData = require("./hospicash/payment.json");

const mobileQuoteData = require("./mobile/quote.json");
const mobileProposalData = require("./mobile/proposal.json");
const mobilePaymentData = require("./mobile/payment.json");

// update hardcoded values
const vertical = "mobile";
const profile = "uat";

const url = profile==="local" ? "http://localhost:9098" : "https://app.skyfall.turtle-feature.com";
const quoteData = vertical === "hospicash" ? hospicashQuoteData : mobileQuoteData;
const proposalData = vertical === "hospicash" ? hospicashProposalData : mobileProposalData;
const paymentData = vertical === "hospicash" ? hospicashPaymentData : mobilePaymentData;

function createQuote() {
    console.log("getting ready with quote")
    axios
        .post(
            `${url}/api/minterprise/quote/v0/premiums/request`,quoteData
            
        )
        .then((response) => {
            console.log("referenceId = " , response.data[0].premiumResultList[0].referenceId, " quoteId = " ,response.data[0].premiumResultList[0].quoteId);
            getQuote(response.data[0].premiumResultList[0].referenceId, response.data[0].premiumResultList[0].quoteId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getQuote(referenceId, quoteId) {
    axios
        .get(
            `${url}/api/minterprise/quote/v0/premiums/result?productCode=${vertical}&referenceId=${referenceId}&quoteId=${quoteId}`
        )
        .then(function (response) {
            console.log("referenceId = " , response.data.referenceId, " Premium Result Id = " ,response.data._id);
            getProposal(response.data.referenceId, response.data._id);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getProposal(referenceId, premiumResultId) {
    console.log("creating proposal");

    proposalData.premiumResultId = premiumResultId;
    proposalData.referenceId = referenceId;

    axios
        .post(
            `${url}/api/minterprise/proposal/v0/proposal/request`,
            proposalData
        )
        .then((response) => {
            console.log("Proposal Id -- > " + (response.data[0].proposalResults[0].proposalId));
            generateLink(referenceId, response.data[0].proposalResults[0].proposalId);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function generateLink(referenceId, proposalId) {

    paymentData.referenceId = referenceId;
    paymentData.proposalId = proposalId;

    console.log("fetching payment link");
    axios
        .post(
            `${url}/api/minterprise/v0/payments/link`,
            paymentData
        )
        .then((response) => {
            console.log("Payment Link -- > " + (response.data.paymentLink));
        })
        .catch(function (error) {
            console.log("error");
        });
}

createQuote();

